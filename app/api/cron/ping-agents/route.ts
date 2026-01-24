import { NextRequest, NextResponse } from 'next/server';
import { Client, type Signer, type Identifier } from '@xmtp/node-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { hexToBytes } from 'viem';
import agentsData from '../../../data/agents.json';
import { Agent } from '../../../types/agent';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// IdentifierKind enum values (can't import const enum with isolatedModules)
const IDENTIFIER_KIND_ETHEREUM = 0;

const AGENTS_FILE_PATH = path.join(process.cwd(), 'app', 'data', 'agents.json');
const PING_MESSAGE = 'ping';
const PING_TIMEOUT_MS = 60000; // 60 seconds to wait for response

/**
 * Create a Signer from a private key for XMTP
 */
function createSigner(privateKeyHex: string): Signer {
  const account = privateKeyToAccount(privateKeyHex as `0x${string}`);
  
  return {
    type: 'EOA' as const,
    getIdentifier: () => ({
      identifier: account.address,
      identifierKind: IDENTIFIER_KIND_ETHEREUM,
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({ message });
      return hexToBytes(signature);
    },
  };
}

/**
 * Get or generate the DB encryption key
 */
function getDbEncryptionKey(): Uint8Array {
  const envKey = process.env.XMTP_DB_ENCRYPTION_KEY;
  if (envKey) {
    // Remove 0x prefix if present
    const cleanKey = envKey.startsWith('0x') ? envKey.slice(2) : envKey;
    return hexToBytes(`0x${cleanKey}`);
  }
  // Generate a random key (not persistent - for development only)
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Cron job endpoint that pings all agents to check their online status
 * Run this daily via Vercel Cron or external scheduler
 * 
 * Required Environment Variables:
 * - XMTP_WALLET_KEY: Private key for the pinger wallet (0x prefixed hex)
 * - XMTP_DB_ENCRYPTION_KEY: Encryption key for XMTP local DB (0x prefixed hex, 32 bytes)
 * - XMTP_ENV: XMTP environment (dev or production)
 * - CRON_SECRET: Secret for authenticating cron requests
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting agent uptime check...');
    
    // Check for required environment variables
    const walletKey = process.env.XMTP_WALLET_KEY;
    if (!walletKey) {
      console.warn('XMTP_WALLET_KEY not set - falling back to canMessage check only');
    }

    const agents = agentsData as Agent[];
    const updatedAgents: Agent[] = [];
    const notifiedCreators = new Set<string>();

    // Initialize XMTP client if wallet key is available
    let xmtpClient: Client | null = null;
    
    if (walletKey) {
      try {
        const signer = createSigner(walletKey);
        const dbEncryptionKey = getDbEncryptionKey();
        const env = (process.env.XMTP_ENV || 'dev') as 'dev' | 'production' | 'local';
        
        xmtpClient = await Client.create(signer, {
          dbEncryptionKey,
          env,
        });
        console.log('XMTP client initialized:', xmtpClient.inboxId);
      } catch (error) {
        console.error('Failed to initialize XMTP client:', error);
      }
    }

    // Check each agent's status
    for (const agent of agents) {
      let newStatus: 'online' | 'offline' | 'unknown' = agent.status;
      const previousStatus = agent.status;

      try {
        if (xmtpClient) {
          // Full ping test: send message and wait for response
          newStatus = await pingAgent(xmtpClient, agent.agentAddress);
        } else {
          // Fallback: just check if address is reachable on XMTP
          const isReachable = await checkAgentReachability(agent.agentAddress);
          newStatus = isReachable ? 'unknown' : 'offline';
        }
      } catch (error) {
        console.error(`Error checking agent ${agent.agentName}:`, error);
        newStatus = 'unknown';
      }

      // If agent went offline, notify creator
      if (previousStatus === 'online' && newStatus === 'offline') {
        if (xmtpClient && !notifiedCreators.has(agent.agentCreator)) {
          try {
            await notifyCreatorAgentDown(agent, xmtpClient);
            notifiedCreators.add(agent.agentCreator);
          } catch (error) {
            console.error(`Failed to notify creator for ${agent.agentName}:`, error);
          }
        }
      }

      updatedAgents.push({
        ...agent,
        status: newStatus,
        lastChecked: new Date().toISOString(),
      });
      
      console.log(`Agent ${agent.agentName}: ${previousStatus} -> ${newStatus}`);
    }

    // Write updated agents back to JSON file
    try {
      await fs.writeFile(
        AGENTS_FILE_PATH,
        JSON.stringify(updatedAgents, null, 2),
        'utf-8'
      );
      console.log('Successfully updated agents.json');
    } catch (error) {
      console.error('Failed to write agents.json:', error);
    }

    // Cleanup XMTP client
    if (xmtpClient) {
      // Close client connection if needed
    }

    const summary = {
      total: updatedAgents.length,
      online: updatedAgents.filter(a => a.status === 'online').length,
      offline: updatedAgents.filter(a => a.status === 'offline').length,
      unknown: updatedAgents.filter(a => a.status === 'unknown').length,
      notified: notifiedCreators.size,
    };

    console.log('Agent uptime check complete:', summary);

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      summary,
      agents: updatedAgents,
    });
  } catch (error) {
    console.error('Error in agent ping cron:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check agent status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Send a ping message to an agent and wait for a response
 */
async function pingAgent(client: Client, agentAddress: string): Promise<'online' | 'offline' | 'unknown'> {
  try {
    // First check if agent is reachable
    const identifiers: Identifier[] = [
      { identifier: agentAddress, identifierKind: IDENTIFIER_KIND_ETHEREUM }
    ];
    
    const canMessageMap = await Client.canMessage(identifiers);
    const canMessage = canMessageMap.get(agentAddress);
    
    if (!canMessage) {
      console.log(`Agent ${agentAddress} is not reachable on XMTP`);
      return 'offline';
    }

    // Get the agent's inbox ID
    const inboxId = await client.fetchInboxIdByIdentifier({
      identifier: agentAddress,
      identifierKind: IDENTIFIER_KIND_ETHEREUM,
    });
    
    if (!inboxId) {
      console.log(`Could not find inbox ID for ${agentAddress}`);
      return 'offline';
    }

    // Create or get existing DM conversation with agent
    const conversation = await client.conversations.createDm(inboxId);
    
    // Send ping message
    await conversation.sendText(PING_MESSAGE);
    console.log(`Sent ping to ${agentAddress}`);
    
    // Wait for response with timeout
    const responseReceived = await waitForResponse(client, conversation.id, PING_TIMEOUT_MS);
    
    return responseReceived ? 'online' : 'unknown';
  } catch (error) {
    console.error(`Failed to ping agent ${agentAddress}:`, error);
    return 'unknown';
  }
}

/**
 * Wait for a response message in a conversation
 */
async function waitForResponse(
  client: Client, 
  conversationId: string, 
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, timeoutMs);

    // Start streaming messages
    const checkMessages = async () => {
      try {
        // Sync messages
        await client.conversations.sync();
        const conversation = await client.conversations.getConversationById(conversationId);
        
        if (conversation) {
          // Get recent messages
          const messages = await conversation.messages({ limit: 5 });
          
          // Check if we received any response after our ping
          for (const msg of messages) {
            // Check if message is from the agent (not from us)
            if (msg.senderInboxId !== client.inboxId) {
              clearTimeout(timeout);
              resolve(true);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking messages:', error);
      }
    };

    // Check immediately and then every 5 seconds
    checkMessages();
    const interval = setInterval(checkMessages, 5000);
    
    // Cleanup on timeout
    setTimeout(() => {
      clearInterval(interval);
    }, timeoutMs);
  });
}

/**
 * Check if an agent address is reachable on XMTP network
 * Uses Client.canMessage() which doesn't require authentication
 */
async function checkAgentReachability(agentAddress: string): Promise<boolean> {
  try {
    const identifiers: Identifier[] = [
      { identifier: agentAddress, identifierKind: IDENTIFIER_KIND_ETHEREUM }
    ];
    
    const canMessageMap = await Client.canMessage(identifiers);
    return canMessageMap.get(agentAddress) ?? false;
  } catch (error) {
    console.error(`Error checking reachability for ${agentAddress}:`, error);
    return false;
  }
}

/**
 * Send XMTP message to agent creator notifying them their agent is down
 */
async function notifyCreatorAgentDown(agent: Agent, xmtpClient: Client): Promise<void> {
  try {
    // Check if creator is reachable
    const identifiers: Identifier[] = [
      { identifier: agent.agentCreator, identifierKind: IDENTIFIER_KIND_ETHEREUM }
    ];
    
    const canMessageMap = await Client.canMessage(identifiers);
    if (!canMessageMap.get(agent.agentCreator)) {
      console.log(`Creator ${agent.agentCreator} is not reachable on XMTP`);
      return;
    }

    // Get creator's inbox ID
    const inboxId = await xmtpClient.fetchInboxIdByIdentifier({
      identifier: agent.agentCreator,
      identifierKind: IDENTIFIER_KIND_ETHEREUM,
    });
    
    if (!inboxId) {
      console.log(`Could not find inbox ID for creator ${agent.agentCreator}`);
      return;
    }

    // Create DM conversation with creator
    const conversation = await xmtpClient.conversations.createDm(inboxId);
    
    // Send notification message
    const message = `🔴 Alert: Your agent "${agent.agentName}" (${agent.agentAddress}) appears to be down and not responding to ping messages. Please investigate.`;
    
    await conversation.sendText(message);
    console.log(`Notified ${agent.agentCreator} about ${agent.agentName}`);
  } catch (error) {
    console.error(`Failed to send notification to ${agent.agentCreator}:`, error);
    throw error;
  }
}

// Allow manual trigger via POST as well
export async function POST(req: NextRequest) {
  return GET(req);
}
