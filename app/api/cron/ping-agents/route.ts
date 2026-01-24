import { NextRequest, NextResponse } from 'next/server';
import { Client, type Identifier } from '@xmtp/node-sdk';
import agentsData from '../../../data/agents.json';
import { Agent } from '../../../types/agent';
import * as fs from 'fs/promises';
import * as path from 'path';

const AGENTS_FILE_PATH = path.join(process.cwd(), 'app', 'data', 'agents.json');

/**
 * Cron job endpoint that pings all agents to check their online status
 * Run this daily via Vercel Cron or external scheduler
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting agent uptime check...');
    
    const agents = agentsData as Agent[];
    const updatedAgents: Agent[] = [];
    const notifiedCreators = new Set<string>();

    // Initialize XMTP client for checking agent status and sending notifications
    // Note: This requires XMTP_WALLET_KEY and XMTP_DB_ENCRYPTION_KEY env vars
    const xmtpClient: unknown = null;
    
    try {
      // For production, ensure these env vars are set
      if (process.env.XMTP_WALLET_KEY && process.env.XMTP_DB_ENCRYPTION_KEY) {
        // TODO: Initialize XMTP client when needed for notifications
        // Currently using canMessage which doesn't require full client init
      }
    } catch (error) {
      console.error('Failed to initialize XMTP client:', error);
    }

    // Check each agent's status
    for (const agent of agents) {
      let newStatus = agent.status;
      const previousStatus = agent.status;

      try {
        // Check if agent address is reachable on XMTP network
        const isReachable = await checkAgentReachability(agent.agentAddress);
        newStatus = isReachable ? 'online' : 'offline';
      } catch (error) {
        console.error(`Error checking agent ${agent.agentName}:`, error);
        newStatus = 'unknown';
      }

      // If agent went offline, notify creator
      if (previousStatus === 'online' && newStatus === 'offline') {
        // Only notify each creator once per run
        if (!notifiedCreators.has(agent.agentCreator)) {
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
    }

    // Write updated agents back to JSON file
    // Note: In production, consider using a database instead
    try {
      await fs.writeFile(
        AGENTS_FILE_PATH,
        JSON.stringify(updatedAgents, null, 2),
        'utf-8'
      );
      console.log('Successfully updated agents.json');
    } catch (error) {
      console.error('Failed to write agents.json:', error);
      // Continue anyway - the status is still returned
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
 * Check if an agent address is reachable on XMTP network
 * Uses Client.canMessage() which doesn't require authentication
 */
async function checkAgentReachability(agentAddress: string): Promise<boolean> {
  try {
    // Use XMTP Client.canMessage to check if address is reachable
    // This is a static method that doesn't require client initialization
    const identifiers = [
      { identifier: agentAddress, identifierKind: 'Ethereum' as const }
    ] as unknown as Identifier[];
    
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
async function notifyCreatorAgentDown(agent: Agent, xmtpClient: unknown): Promise<void> {
  if (!xmtpClient) {
    console.log(`Would notify ${agent.agentCreator} about ${agent.agentName} being down`);
    return;
  }

  try {
    // Create DM conversation with creator
    // @ts-expect-error - xmtpClient type is unknown for now
    const conversation = await xmtpClient.conversations.createDm(agent.agentCreator);
    
    // Send notification message
    const message = `🔴 Alert: Your agent "${agent.agentName}" (${agent.agentAddress}) seems to be down and not responding to messages. Please investigate.`;
    
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
