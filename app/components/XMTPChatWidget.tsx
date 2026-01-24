'use client';

import { useState, useRef, useEffect } from 'react';

interface XMTPChatWidgetProps {
  agentAddress: `0x${string}`;
  agentName: string;
  userAddress?: string;
  onClose: () => void;
}

export function XMTPChatWidget({ agentAddress, agentName, userAddress, onClose }: XMTPChatWidgetProps) {
  const [messages, setMessages] = useState<Array<{ text: string; sender: 'user' | 'agent'; time: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    // TODO: Implement actual XMTP wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setMessages([
        { text: `Welcome! I'm ${agentName}. How can I help you today?`, sender: 'agent', time: getCurrentTime() }
      ]);
    }, 1500);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { text: userMessage, sender: 'user', time: getCurrentTime() }]);

    // TODO: Implement actual XMTP message sending
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: `Thanks for your message! This is a demo response from ${agentName}. Full XMTP integration coming soon.`, sender: 'agent', time: getCurrentTime() },
      ]);
      setIsLoading(false);
    }, 1000);
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
