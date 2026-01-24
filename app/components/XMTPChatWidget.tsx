'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSignMessage } from 'wagmi';
import { Client, IdentifierKind, type Signer, type Identifier, type Dm } from '@xmtp/browser-sdk';
import { hexToBytes } from 'viem';

interface XMTPChatWidgetProps {
  agentAddress: `0x${string}`;
  agentName: string;
  userAddress?: string;
  onClose: () => void;
}

interface ChatMessage {
  text: string;
  sender: 'user' | 'agent';
  time: string;
  id?: string;
}

export function XMTPChatWidget({ agentAddress, agentName, userAddress, onClose }: XMTPChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const xmtpClientRef = useRef<Client | null>(null);
  const conversationRef = useRef<Dm | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  
  const { signMessageAsync } = useSignMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
    };
  }, []);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Create a Signer from the connected wallet
  const createWalletSigner = useCallback((): Signer | null => {
    if (!userAddress) return null;
    
    return {
      type: 'EOA' as const,
      getIdentifier: () => ({
        identifier: userAddress,
        identifierKind: IdentifierKind.Ethereum,
      }),
      signMessage: async (message: string): Promise<Uint8Array> => {
        const signature = await signMessageAsync({ message });
        return hexToBytes(signature);
      },
    };
  }, [userAddress, signMessageAsync]);

  // Start streaming messages from all conversations
  const startMessageStream = useCallback(async (client: Client, conversationId: string) => {
    try {
      // Abort any existing stream
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      streamAbortRef.current = new AbortController();

      // Stream all messages - filter to our conversation
      const stream = await client.conversations.streamAllMessages({
        onValue: (message) => {
          // Only process messages from the target conversation
          if (message.conversationId !== conversationId) return;
          
          // Only add messages from the agent (not our own)
          if (message.senderInboxId !== client.inboxId) {
            const content = typeof message.content === 'string' 
              ? message.content 
              : JSON.stringify(message.content);
            
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, {
                text: content,
                sender: 'agent' as const,
                time: new Date(Number(message.sentAtNs) / 1000000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                id: message.id,
              }];
            });
            setIsLoading(false);
          }
        },
        onError: (error) => {
          console.error('Message stream error:', error);
        },
      });

      // Store reference to stop the stream later
      // The stream continues until explicitly stopped
      return stream;
    } catch (err) {
      // Stream was aborted or failed
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Message stream error:', err);
      }
    }
  }, []);

  const handleConnect = async () => {
    if (!userAddress) {
      setError('No wallet connected. Please connect your wallet first.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create signer from connected wallet
      const signer = createWalletSigner();
      if (!signer) {
        throw new Error('Failed to create wallet signer');
      }

      // Create XMTP client
      const client = await Client.create(signer, {
        env: 'dev', // Use 'production' for mainnet
      });
      xmtpClientRef.current = client;
      console.log('XMTP client created:', client.inboxId);

      // Check if agent is reachable
      const identifiers: Identifier[] = [
        { identifier: agentAddress, identifierKind: IdentifierKind.Ethereum }
      ];
      const canMessageMap = await Client.canMessage(identifiers);
      
      if (!canMessageMap.get(agentAddress)) {
        throw new Error(`Agent ${agentName} is not available on XMTP network`);
      }

      // Get the agent's inbox ID
      const inboxId = await client.fetchInboxIdByIdentifier({
        identifier: agentAddress,
        identifierKind: IdentifierKind.Ethereum,
      });

      if (!inboxId) {
        throw new Error(`Could not find inbox ID for agent ${agentName}`);
      }

      // Create DM conversation with agent
      const conversation = await client.conversations.createDm(inboxId);
      conversationRef.current = conversation;
      console.log('Conversation created:', conversation.id);

      // Load existing messages
      const existingMessages = await conversation.messages({ limit: BigInt(50) });
      const formattedMessages: ChatMessage[] = existingMessages.map((msg) => ({
        text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        sender: (msg.senderInboxId === client.inboxId ? 'user' : 'agent') as 'user' | 'agent',
        time: new Date(Number(msg.sentAtNs) / 1000000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        id: msg.id,
      })).reverse(); // Reverse to show oldest first

      setMessages(formattedMessages.length > 0 ? formattedMessages : [
        { text: `Connected! You can now chat with ${agentName}.`, sender: 'agent', time: getCurrentTime() }
      ]);

      setIsConnected(true);
      setIsConnecting(false);

      // Start streaming new messages
      startMessageStream(client, conversation.id);

    } catch (err) {
      console.error('XMTP connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to XMTP');
      setIsConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected || !conversationRef.current) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { 
      text: userMessage, 
      sender: 'user', 
      time: getCurrentTime(),
      id: tempId,
    }]);

    try {
      // Send message via XMTP
      await conversationRef.current.sendText(userMessage);
      console.log('Message sent:', userMessage);
      
      // Message was sent successfully
      // The response will come through the message stream
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsLoading(false);
      
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  // Connection screen
  if (!isConnected) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '400px',
            margin: '20px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>Connect to XMTP</span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '40px 30px', textAlign: 'center' }}>
            {/* Agent Avatar */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '36px',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              }}
            >
              🤖
            </div>

            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              {agentName}
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Connect your wallet to start a secure conversation via the XMTP protocol.
            </p>

            {/* Address Display */}
            {userAddress && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>Your Address</p>
                <p style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '13px' }}>
                  {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '24px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: isConnecting 
                  ? 'linear-gradient(135deg, #4b5563, #374151)' 
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                borderRadius: '14px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isConnecting ? 'wait' : 'pointer',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {isConnecting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⚡</span>
                  Connecting to XMTP...
                </span>
              ) : (
                '🔐 Connect Wallet'
              )}
            </button>

            {/* Protocol Info */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '12px' }}>
                <span>🔒</span> End-to-end encrypted
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '12px' }}>
                <span>⚡</span> Decentralized
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          height: '600px',
          maxHeight: '80vh',
          margin: '20px',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🤖
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>
                {agentName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                  }}
                />
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Online via XMTP</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s ease',
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {msg.text}
                </p>
              </div>
              <span
                style={{
                  color: '#6b7280',
                  fontSize: '11px',
                  marginTop: '4px',
                  padding: '0 4px',
                }}
              >
                {msg.time}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 20px',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#9ca3af',
                        animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '14px 24px',
                background: inputValue.trim() && !isLoading
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '14px',
                color: inputValue.trim() && !isLoading ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '700',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                boxShadow: inputValue.trim() && !isLoading ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
