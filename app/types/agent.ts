export type AgentStatus = 'online' | 'offline' | 'unknown';

export interface Agent {
  agentName: string;
  agentAddress: `0x${string}`;
  agentENS?: string;
  agentCreator: `0x${string}`;
  agentWebsite?: string;
  agentCategories: string[];
  agentX?: string;
  agentFC?: string;
  profileImage?: string;
  status: AgentStatus;
  lastChecked: string; // ISO 8601 timestamp
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
