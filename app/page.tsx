'use client';

import { useEffect, useState } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { AgentCard } from './components/AgentCard';
import { useAgentFilter } from './hooks/useAgentFilter';
import { AGENT_CATEGORIES, type Agent } from './types/agent';
import styles from './page.module.css';

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [showBanner, setShowBanner] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch agents from API
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        if (data.success && data.agents) {
          setAgents(data.agents);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const {
    searchQuery,
    selectedCategory,
    filteredAgents,
    handleSearch,
    handleCategorySelect,
  } = useAgentFilter(agents);

  return (
    <div className={styles.container}>
      {/* Desktop Corner Banner */}
      <a
        href="https://github.com/tantodefi/xmtp-agent-directory"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cornerBanner}
      >
        <span>Building an agent?</span>
        <br />
        <span>Add it to the directory</span>
      </a>

      {/* Mobile Top Banner */}
      {showBanner && (
        <div className={styles.mobileBanner}>
          <a
            href="https://github.com/tantodefi/xmtp-agent-directory"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileBannerLink}
          >
            🚀 Building an agent? Add it to the directory repo
          </a>
          <button
            onClick={() => setShowBanner(false)}
            className={styles.mobileBannerClose}
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>XMTP Agent Directory</h1>
        <p className={styles.subtitle}>
          Discover and connect with AI agents on the XMTP network
        </p>
      </header>

      {/* Search Input */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name or ENS..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Category Filter Chips */}
      <div className={styles.categoryContainer}>
        <button
          className={`${styles.categoryChip} ${!selectedCategory ? styles.categoryChipActive : ''}`}
          onClick={() => handleCategorySelect(null)}
        >
          All
        </button>
        {AGENT_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`${styles.categoryChip} ${selectedCategory === category ? styles.categoryChipActive : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className={styles.agentGrid}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <p>Loading agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No agents found matching your criteria</p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <AgentCard key={agent.agentAddress} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}
