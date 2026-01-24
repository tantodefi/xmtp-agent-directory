'use client';

import { Agent } from '../types/agent';
import { ChatButton } from './ChatButton';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const statusColors: Record<string, string> = {
    online: '#22c55e',
    offline: '#ef4444',
    unknown: '#6b7280',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenAddress = (address: string) => {
    if (isMobile) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(agent.agentAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const imageSize = isMobile ? 48 : 72;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: `1px solid ${isHovered ? '#ffffff' : '#4b5563'}`,
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '12px' : '20px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: isHovered 
          ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Status Indicator - Top Left Corner */}
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '10px' : '16px',
          left: isMobile ? '10px' : '16px',
          width: isMobile ? '8px' : '10px',
          height: isMobile ? '8px' : '10px',
          borderRadius: '50%',
          backgroundColor: statusColors[agent.status] || statusColors.unknown,
          boxShadow: `0 0 8px ${statusColors[agent.status] || statusColors.unknown}`,
          zIndex: 10,
        }}
        title={`Status: ${agent.status}\nLast checked: ${formatDate(agent.lastChecked)}`}
      />

      {/* Horizontal Layout: Image -> Info -> Chat Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
        {/* Profile Image - Circular */}
        <div style={{ flexShrink: 0, marginLeft: isMobile ? '8px' : '16px' }}>
          {agent.profileImage ? (
            <div
              style={{
                width: `${imageSize}px`,
                height: `${imageSize}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${isHovered ? '#3b82f6' : '#4b5563'}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              <Image
                src={agent.profileImage}
                alt={agent.agentName}
                width={imageSize}
                height={imageSize}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                unoptimized
              />
            </div>
          ) : (
            <div
              style={{
                width: `${imageSize}px`,
                height: `${imageSize}px`,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '16px' : '24px',
                fontWeight: 'bold',
                color: 'white',
                border: `2px solid ${isHovered ? '#3b82f6' : '#4b5563'}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              {agent.agentName.charAt(0)}
            </div>
          )}
        </div>

        {/* Agent Info - Center */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.agentName}
          </h3>

          {agent.agentENS && (
            <p
              style={{
                fontSize: isMobile ? '10px' : '12px',
                color: '#60a5fa',
                fontWeight: '600',
                marginBottom: isMobile ? '4px' : '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⚡ {agent.agentENS}
            </p>
          )}

          {/* Categories - hide some on mobile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '4px' : '6px', marginBottom: isMobile ? '4px' : '8px' }}>
            {agent.agentCategories.slice(0, isMobile ? 2 : 3).map((category) => (
              <span
                key={category}
                style={{
                  padding: isMobile ? '1px 6px' : '2px 8px',
                  fontSize: isMobile ? '9px' : '11px',
                  fontWeight: '600',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {category}
              </span>
            ))}
          </div>

          {/* Address with Copy Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: isMobile ? '4px' : '8px',
            }}
          >
            <p
              style={{
                fontSize: isMobile ? '9px' : '11px',
                fontFamily: 'monospace',
                color: '#9ca3af',
                margin: 0,
              }}
            >
              {shortenAddress(agent.agentAddress)}
            </p>
            <button
              onClick={copyAddress}
              style={{
                background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '4px',
                padding: isMobile ? '2px 4px' : '2px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Copy address"
            >
              <span style={{ fontSize: isMobile ? '10px' : '12px' }}>
                {copied ? '✓' : '📋'}
              </span>
            </button>
          </div>

          {/* Links - compact on mobile */}
          {(agent.agentWebsite || agent.agentX || agent.agentFC) && (
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px' }}>
              {agent.agentWebsite && (
                <a
                  href={agent.agentWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '500',
                    color: '#60a5fa',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🌐{!isMobile && ' Site'}
                </a>
              )}
              {agent.agentX && (
                <a
                  href={agent.agentX}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '500',
                    color: '#60a5fa',
                    textDecoration: 'none',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  𝕏
                </a>
              )}
              {agent.agentFC && (
                <a
                  href={agent.agentFC}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '500',
                    color: '#a78bfa',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🎯{!isMobile && ' FC'}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Chat Button - Far Right */}
        <div style={{ flexShrink: 0 }}>
          <ChatButton
            agentAddress={agent.agentAddress}
            agentName={agent.agentName}
            onChatToggle={setShowChat}
            showingChat={showChat}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Expanded Chat Widget */}
      {showChat && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #374151',
          }}
        >
          {/* Chat widget content will appear here */}
        </div>
      )}
    </div>
  );
}
