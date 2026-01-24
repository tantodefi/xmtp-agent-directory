'use client';

import { useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { AgentCard } from './components/AgentCard';
import { useAgentFilter } from './hooks/useAgentFilter';
import { AGENT_CATEGORIES, type Agent } from './types/agent';
import agentsData from './data/agents.json';
import styles from './page.module.css';

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const {
    searchQuery,
    selectedCategory,
    filteredAgents,
    handleSearch,
    handleCategorySelect,
  } = useAgentFilter(agentsData as Agent[]);

  return (
    <div className={styles.container}>
      {/* Corner Banner */}
      <a
        href="https://github.com/base-org/base-demos"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cornerBanner}
      >
        <span>Building an agent?</span>
        <br />
        <span>Add it to the directory repo</span>
      </a>

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
        {filteredAgents.length === 0 ? (
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
