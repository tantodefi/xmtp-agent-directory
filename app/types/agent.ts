export type AgentStatus = 'online' | 'offline' | 'unknown';

export interface Agent {
  agentName: string;
  agentAddress: `0x${string}`;
  agentENS?: string;
  // Optional: Creator address for offline notifications (requires XMTP-enabled address)
  agentCreator?: `0x${string}`;
  agentWebsite?: string;
  agentCategories: string[];
  agentX?: string;
  agentFC?: string;
  profileImage?: string;
  // Status fields are optional - the uptime checker will populate them
  status?: AgentStatus;
  lastChecked?: string; // ISO 8601 timestamp
}

// Internal type with required status fields (after normalization)
export interface NormalizedAgent extends Agent {
  status: AgentStatus;
  lastChecked: string;
}

export const AGENT_CATEGORIES = [
  'finance',
  'trading',
  'social',
  'assistant',
  'sports-betting',
  'lottery',
  'defi',
  'gaming',
  'nft',
  'governance',
  'analytics',
  'payments',
] as const;

export type AgentCategory = typeof AGENT_CATEGORIES[number];
