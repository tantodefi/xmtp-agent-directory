'use client';

import { useIsInMiniApp } from '@coinbase/onchainkit/minikit';
import { useOpenUrl } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { XMTPChatWidget } from './XMTPChatWidget';

interface ChatButtonProps {
  agentAddress: `0x${string}`;
  agentName: string;
  onChatToggle?: (isOpen: boolean) => void;
  showingChat?: boolean;
  isMobile?: boolean;
}

export function ChatButton({ agentAddress, agentName, onChatToggle, showingChat: _showingChat = false, isMobile = false }: ChatButtonProps) {
  const { isInMiniApp } = useIsInMiniApp();
  const openUrl = useOpenUrl();
  const { address: userAddress, isConnected: _isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);

  // Use deeplinks when running in any Mini App context (Base App, Farcaster, World App)
  // This provides a native mobile feel
  const shouldUseDeeplink = isInMiniApp;

  const handleChat = async () => {
    setIsLoading(true);
    try {
      if (shouldUseDeeplink) {
        // Use Base App deeplink for native messaging
        // Format: cbwallet://messaging/{0xAddress}
        // This opens the chat directly in Base App's XMTP messaging interface
        const deeplink = `cbwallet://messaging/${agentAddress}`;
        openUrl(deeplink);
        setTimeout(() => setIsLoading(false), 500);
      } else {
        // Show inline chat widget for web browsers
        const newState = !showChatWidget;
        setShowChatWidget(newState);
        onChatToggle?.(newState);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to open chat:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleChat();
        }}
        disabled={isLoading}
        style={{
          padding: isMobile ? '8px 12px' : '10px 20px',
          background: showChatWidget 
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white',
          borderRadius: isMobile ? '8px' : '10px',
          fontWeight: '700',
          fontSize: isMobile ? '11px' : '14px',
          border: 'none',
          cursor: isLoading ? 'wait' : 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          opacity: isLoading ? 0.7 : 1,
        }}
        aria-label={`Chat with ${agentName}`}
      >
        {isLoading ? '...' : showChatWidget ? '✕' : (isMobile ? '💬' : '💬 Chat')}
      </button>

      {showChatWidget && !shouldUseDeeplink && (
        <XMTPChatWidget
          agentAddress={agentAddress}
          agentName={agentName}
          userAddress={userAddress}
          onClose={() => {
            setShowChatWidget(false);
            onChatToggle?.(false);
          }}
        />
      )}
    </>
  );
}
