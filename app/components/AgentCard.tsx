'use client';

import { Agent } from '../types/agent';
import { ChatButton } from './ChatButton';
import Image from 'next/image';
import { useState } from 'react';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: `1px solid ${isHovered ? '#ffffff' : '#4b5563'}`,
        borderRadius: '16px',
        padding: '20px',
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
          top: '16px',
          left: '16px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: statusColors[agent.status] || statusColors.unknown,
          boxShadow: `0 0 8px ${statusColors[agent.status] || statusColors.unknown}`,
          zIndex: 10,
        }}
        title={`Status: ${agent.status}\nLast checked: ${formatDate(agent.lastChecked)}`}
      />

      {/* Horizontal Layout: Image -> Info -> Chat Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Profile Image - Circular */}
        <div style={{ flexShrink: 0, marginLeft: '16px' }}>
          {agent.profileImage ? (
            <div
              style={{
                width: '72px',
                height: '72px',
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
                width={72}
                height={72}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                unoptimized
              />
            </div>
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
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
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '4px',
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
                fontSize: '12px',
                color: '#60a5fa',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⚡ {agent.agentENS}
            </p>
          )}

          {/* Categories */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {agent.agentCategories.slice(0, 3).map((category) => (
              <span
                key={category}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
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

          {/* Address */}
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#9ca3af',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '8px',
            }}
          >
            {agent.agentAddress}
          </p>

          {/* Links */}
          {(agent.agentWebsite || agent.agentX || agent.agentFC) && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {agent.agentWebsite && (
                <a
                  href={agent.agentWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#60a5fa',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🌐 Site
                </a>
              )}
              {agent.agentX && (
                <a
                  href={agent.agentX}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
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
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#a78bfa',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🎯 FC
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
