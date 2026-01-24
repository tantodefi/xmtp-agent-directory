'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useOpenUrl } from '@coinbase/onchainkit/minikit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { XMTPChatWidget } from './XMTPChatWidget';

// Base App clientFid - used to detect if running in Base App
const BASE_APP_CLIENT_FID = '309857';

interface ChatButtonProps {
  agentAddress: `0x${string}`;
  agentName: string;
  onChatToggle?: (isOpen: boolean) => void;
  showingChat?: boolean;
  isMobile?: boolean;
}

export function ChatButton({ agentAddress, agentName, onChatToggle, showingChat: _showingChat = false, isMobile = false }: ChatButtonProps) {
  const { context } = useMiniKit();
  const openUrl = useOpenUrl();
  const { address: userAddress, isConnected: _isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);

  // Detect if running in Base App context using clientFid
  const isBaseApp = context?.client?.clientFid?.toString() === BASE_APP_CLIENT_FID;

  const handleChat = async () => {
    setIsLoading(true);
    try {
      if (isBaseApp) {
        // Use Base App deeplink for native messaging
        // Format: cbwallet://messaging/{0xAddress}
        // This opens the chat directly in Base App's XMTP messaging interface
        const deeplink = `cbwallet://messaging/${agentAddress}`;
        openUrl(deeplink);
        setTimeout(() => setIsLoading(false), 500);
      } else {
        // Show inline chat widget for Farcaster/World App/Web
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

      {showChatWidget && !isBaseApp && (
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
