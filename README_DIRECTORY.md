# XMTP Agent Directory

A searchable directory of XMTP AI agents built as a Next.js mini app for Base App, Farcaster, and World App.

## Features

- 🔍 **Search & Filter** - Find agents by name, ENS, or category
- 🟢 **Live Status Indicators** - Real-time agent availability status
- 💬 **Client-Aware Chat** - Automatic deeplink for Base App messaging
- 🤖 **Automated Uptime Monitoring** - Daily health checks with creator notifications
- 📱 **Multi-Client Support** - Works in Base App, Farcaster, and World App

## Architecture

### Frontend Components

- **[app/page.tsx](app/page.tsx)** - Main directory page with search, filters, and agent grid
- **[app/components/AgentCard.tsx](app/components/AgentCard.tsx)** - Agent card with status, links, and chat button
- **[app/components/ChatButton.tsx](app/components/ChatButton.tsx)** - Smart chat button using Base App deeplinks
- **[app/hooks/useAgentFilter.ts](app/hooks/useAgentFilter.ts)** - Search and filter logic with URL state

### Data Layer

- **[app/data/agents.json](app/data/agents.json)** - Agent registry (JSON for MVP, migrate to DB for production)
- **[app/types/agent.ts](app/types/agent.ts)** - TypeScript type definitions

### Backend API

- **[app/api/cron/ping-agents/route.ts](app/api/cron/ping-agents/route.ts)** - Daily uptime checker using XMTP `Client.canMessage()`

## Agent Schema

```typescript
{
  agentName: string;           // Display name
  agentAddress: `0x${string}`; // Ethereum address
  agentENS?: string;           // ENS name
  agentCreator: `0x${string}`; // Creator address for notifications
  agentWebsite?: string;       // Agent website URL
  agentCategories: string[];   // Array of category tags
  agentX?: string;             // X/Twitter URL
  agentFC?: string;            // Farcaster profile URL
  status: 'online' | 'offline' | 'unknown';
  lastChecked: string;         // ISO 8601 timestamp
}
```

## Available Categories

`finance`, `trading`, `social`, `assistant`, `sports-betting`, `lottery`, `defi`, `gaming`, `nft`, `governance`, `analytics`, `payments`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# XMTP Configuration (required for uptime checker notifications)
XMTP_WALLET_KEY=0x...          # Private key for XMTP agent
XMTP_DB_ENCRYPTION_KEY=0x...   # Encryption key for local XMTP DB
XMTP_ENV=production            # 'dev' or 'production'

# Cron Security (optional but recommended)
CRON_SECRET=your_secret_token  # Bearer token to protect cron endpoint
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The cron job is configured in [vercel.json](vercel.json) to run daily at midnight UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/ping-agents",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Manual Cron Trigger

For testing or manual runs:

```bash
curl -X POST https://your-app.vercel.app/api/cron/ping-agents \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Adding New Agents

### Option 1: Direct Edit (MVP)

Edit [app/data/agents.json](app/data/agents.json):

```json
{
  "agentName": "My Agent",
  "agentAddress": "0x...",
  "agentENS": "myagent.eth",
  "agentCreator": "0x...",
  "agentWebsite": "https://myagent.xyz",
  "agentCategories": ["defi", "finance"],
  "agentX": "https://x.com/myagent",
  "agentFC": "https://warpcast.com/myagent",
  "status": "unknown",
  "lastChecked": "2026-01-23T00:00:00.000Z"
}
```

### Option 2: GitHub Fork (Recommended)

1. Fork the repository
2. Add your agent to `app/data/agents.json`
3. Submit a pull request

The corner banner links to the GitHub repo for easy forking.

## How It Works

### Uptime Checker

The [/api/cron/ping-agents](app/api/cron/ping-agents/route.ts) endpoint:

1. Loads all agents from `agents.json`
2. Checks each agent using XMTP `Client.canMessage()`
3. Updates `status` and `lastChecked` fields
4. If agent goes offline, sends XMTP message to `agentCreator`
5. Writes updated data back to `agents.json`

### Chat Integration

The [ChatButton](app/components/ChatButton.tsx) component uses Base App deeplinks:

```typescript
const deeplink = `cbwallet://messaging/${agentAddress}`;
openUrl(deeplink);
```

This works in:
- ✅ Base App (native messaging)
- ✅ Farcaster clients (deeplink)
- ✅ World App (deeplink)

## Future Enhancements

### Recommended Upgrades

1. **Database Migration** - Replace JSON file with Postgres/SQLite for production
2. **Inline Chat Widget** - Embed XMTP chat for Farcaster/World App contexts
3. **Agent Registration API** - Allow self-service agent registration
4. **Advanced Analytics** - Track uptime history, response times, user interactions
5. **Category Management** - Dynamic category creation and management
6. **Search Improvements** - Full-text search, fuzzy matching, tag autocomplete

### Database Schema (Proposed)

```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(42) UNIQUE NOT NULL,
  ens VARCHAR(255),
  creator_address VARCHAR(42) NOT NULL,
  website VARCHAR(255),
  categories TEXT[], -- PostgreSQL array
  twitter_url VARCHAR(255),
  farcaster_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'unknown',
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE uptime_checks (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  status VARCHAR(20),
  checked_at TIMESTAMP DEFAULT NOW(),
  response_time_ms INTEGER
);

CREATE INDEX idx_agents_address ON agents(address);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_uptime_agent_id ON uptime_checks(agent_id);
```

## Technical Stack

- **Framework**: Next.js 15.3 (App Router)
- **Styling**: CSS Modules
- **State**: React hooks + URL params
- **XMTP**: `@xmtp/node-sdk` for backend checks
- **OnchainKit**: MiniKit for Base App integration
- **Deployment**: Vercel (with Cron)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your agent or feature
4. Submit a pull request

## License

MIT

## Support

For questions or issues, please open a GitHub issue.
