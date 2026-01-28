# XMTP Agent Directory

A decentralized directory for discovering and chatting with XMTP-enabled AI agents. Built with Next.js, OnchainKit, and the XMTP protocol.

![Agent Directory](public/splash.png)

## Quickstart

### Prerequisites

- Node.js 18+ and npm
- A wallet with an Ethereum address (for chatting with agents)
- [Vercel](https://vercel.com/) account for deployment (optional)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) Client API Key

### 1. Clone and Install

```bash
git clone https://github.com/tantodefi/xmtp-agent-directory.git
cd xmtp-agent-directory
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
# Development Mode (loads example agents for testing)
DEV_MODE=true

# Required for OnchainKit
NEXT_PUBLIC_PROJECT_NAME="Agent Directory"
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<YOUR-CDP-API-KEY>
NEXT_PUBLIC_URL=http://localhost:3000

# Optional: For uptime checker cron job
XMTP_WALLET_KEY=0x...          # Private key for backend pinger wallet
XMTP_DB_ENCRYPTION_KEY=0x...   # 32-byte encryption key for XMTP DB
XMTP_ENV=dev                    # 'dev' or 'production'
CRON_SECRET=your-secret-here    # For authenticating cron requests
```

**Generate XMTP keys:**
```bash
# Generate wallet private key
openssl rand -hex 32 | sed 's/^/0x/'

# Generate DB encryption key
openssl rand -hex 32 | sed 's/^/0x/'
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the directory.

### 4. Deploy to Vercel

```bash
vercel --prod
```

Add environment variables to Vercel:
```bash
vercel env add NEXT_PUBLIC_PROJECT_NAME production
vercel env add NEXT_PUBLIC_ONCHAINKIT_API_KEY production
vercel env add NEXT_PUBLIC_URL production
```

---

## Features

### 🔍 Agent Discovery
- **Search**: Find agents by name, ENS, or wallet address
- **Categories**: Filter by category (DeFi, Trading, NFT, Social, etc.)
- **Status Indicators**: Real-time online/offline status for each agent

### 💬 XMTP Messaging
- **Direct Chat**: Message agents directly via the XMTP protocol
- **Base App Integration**: Automatic deeplinks to Base App messaging when accessed from Base App
- **Inline Chat Widget**: Full XMTP chat experience in browsers without Base App

### 📊 Uptime Monitoring
- **Daily Health Checks**: Automated ping/pong tests to verify agent availability
- **Creator Notifications**: Agents creators are notified via XMTP when their agent goes offline
- **Status Updates**: Real-time status updates in the directory

### 📱 Mobile Responsive
- **Optimized for Mobile**: Clean mobile-first design
- **Dismissible Banner**: Non-intrusive mobile info banner
- **Compact Cards**: Space-efficient agent cards on small screens

---

## Public API

The agent directory exposes a free public API for fetching all registered agents.

### Endpoint

```
GET https://xmtp-agent-directory.vercel.app/api/agents
```

### Example

```bash
curl https://xmtp-agent-directory.vercel.app/api/agents
```

### Response

```json
{
  "success": true,
  "count": 5,
  "agents": [
    {
      "agentName": "Bracky",
      "agentAddress": "0x...",
      "agentENS": "bracky.eth",
      "agentCategories": ["bracket", "sports"],
      "status": "online",
      "lastChecked": "2026-01-28T12:00:00.000Z"
    }
  ]
}
```

### Rate Limiting

- **30 requests per minute** per IP address
- Rate limit headers included in response:
  - `X-RateLimit-Limit`: Max requests per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Seconds until reset
- Returns `429 Too Many Requests` when exceeded

### CORS

The API supports CORS from all origins, making it accessible from browser-based applications.

---

## Adding Your Own Agent

Want to list your XMTP agent in the directory? Follow these steps:

### Step 1: Fork the Repository

1. Go to the [repository on GitHub](https://github.com/tantodefi/xmtp-agent-directory)
2. Click the **Fork** button in the top right
3. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/xmtp-agent-directory.git
   cd xmtp-agent-directory
   ```

### Step 2: Ensure Your Agent is XMTP-Enabled

Your agent must be registered on the XMTP network. Verify by checking if your agent's address is reachable:

```typescript
import { Client, type Identifier } from '@xmtp/browser-sdk';

const identifiers: Identifier[] = [
  { identifier: "0xYourAgentAddress", identifierKind: "Ethereum" }
];

const canMessage = await Client.canMessage(identifiers);
console.log(canMessage.get("0xYourAgentAddress")); // Should be true
```

If your agent isn't XMTP-enabled, see the [XMTP Agent documentation](https://docs.xmtp.org) to get started.

### Step 3: Create Your Agent JSON File

Create a new file in `app/data/` named after your agent (e.g., `my-agent.json`):

```json
{
  "agentName": "Your Agent Name",
  "agentAddress": "0xYourAgentWalletAddress",
  "agentENS": "your-agent.eth",
  "agentWebsite": "https://youragent.com",
  "agentCategories": ["defi", "assistant"],
  "agentX": "https://x.com/youragent",
  "agentFC": "https://warpcast.com/youragent",
  "profileImage": "https://yourdomain.com/agent-avatar.png"
}
```

> **Note:** You can leave `status`, `lastChecked`, and `agentCreator` fields blank or omit them entirely. The uptime checker will automatically populate status fields when it runs. The `agentCreator` field is only needed if you want offline notifications sent to your XMTP address.

#### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `agentName` | Display name of your agent | `"DeFi Assistant"` |
| `agentAddress` | XMTP-enabled wallet address | `"0x1234...abcd"` |
| `agentCategories` | Array of category tags | `["defi", "trading"]` |

#### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| `agentCreator` | Your wallet address for offline notifications (XMTP-enabled) | `"0xabcd...1234"` |
| `agentUsername` | Base App username for profile links | `"myagent"` |
| `agentENS` | ENS domain for your agent | `"myagent.eth"` |
| `agentWebsite` | Agent's website URL | `"https://myagent.xyz"` |
| `agentX` | X (Twitter) profile URL | `"https://x.com/myagent"` |
| `agentFC` | Farcaster/Warpcast profile URL | `"https://warpcast.com/myagent"` |
| `profileImage` | Avatar image URL (200x200 recommended) | `"https://...image.png"` |
| `status` | Initial status (auto-populated by uptime checker) | `"online"` |
| `lastChecked` | ISO timestamp (auto-populated by uptime checker) | `"2026-01-24T00:00:00.000Z"` |

#### Available Categories

Choose from these categories:
- `defi` - DeFi protocols and tools
- `trading` - Trading bots and analytics
- `nft` - NFT discovery and curation
- `social` - Social features and community
- `assistant` - General purpose assistants
- `analytics` - Data and analytics tools
- `sports-betting` - Sports betting and odds
- `finance` - General finance tools

### Step 4: Test Locally

```bash
npm run dev
```

Verify your agent appears correctly in the directory and the chat button works.

### Step 5: Submit a Pull Request

1. Commit your changes:
   ```bash
   git add app/data/your-agent-name.json
   git commit -m "Add [Your Agent Name] to directory"
   ```

2. Push to your fork:
   ```bash
   git push origin main
   ```

3. Open a Pull Request on GitHub with:
   - Agent name and description
   - Link to your agent's documentation
   - Confirmation that your agent is XMTP-enabled

---

## Project Structure

```
app/
├── api/
│   ├── agents/              # API endpoint to serve agent data
│   └── cron/
│       └── ping-agents/     # Uptime checker cron job
├── components/
│   ├── AgentCard.tsx        # Individual agent card
│   ├── ChatButton.tsx       # Context-aware chat button
│   └── XMTPChatWidget.tsx   # Inline XMTP chat modal
├── data/
│   ├── example-agents.json  # Example agents for development (DEV_MODE=true)
│   └── *.json               # Individual agent JSON files (production)
├── hooks/
│   └── useAgentFilter.ts    # Search and filter logic
├── lib/
│   └── loadAgents.ts        # Agent loading utility (handles DEV_MODE)
├── types/
│   └── agent.ts             # TypeScript definitions
└── page.tsx                 # Main directory page
```

---

## How It Works

### Uptime Checker

The [/api/cron/ping-agents](app/api/cron/ping-agents/route.ts) endpoint runs daily via Vercel Cron:

1. Loads all agents from individual JSON files in `app/data/` (or `example-agents.json` if `DEV_MODE=true`)
2. Creates an XMTP client with the configured wallet key
3. Sends a "ping" message to each agent and waits up to 60 seconds for a response
4. Updates `status` (`online`/`offline`/`unknown`) and `lastChecked` fields
5. If an agent goes offline, sends an XMTP notification to the `agentCreator` address
6. Writes updated data back to each agent's individual JSON file (skipped in DEV_MODE)

**Cron Schedule** (configured in [vercel.json](vercel.json)):
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

**Manual Trigger:**
```bash
curl -X POST https://your-app.vercel.app/api/cron/ping-agents \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Chat Integration

The [ChatButton](app/components/ChatButton.tsx) component detects the client context:

- **In Base App**: Opens native messaging via deeplink `cbwallet://messaging/{agentAddress}`
- **In Browser/Other**: Opens the inline [XMTPChatWidget](app/components/XMTPChatWidget.tsx) with full XMTP messaging

```typescript
// Base App deeplink format
const deeplink = `cbwallet://messaging/${agentAddress}`;
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DEV_MODE` | No | `true` to load example agents, `false` for production (default: `false`) |
| `NEXT_PUBLIC_PROJECT_NAME` | Yes | App display name |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Yes | CDP API key |
| `NEXT_PUBLIC_URL` | Yes | Production URL |
| `XMTP_WALLET_KEY` | No* | Private key for uptime pinger |
| `XMTP_DB_ENCRYPTION_KEY` | No* | Encryption key for XMTP DB |
| `XMTP_ENV` | No | `dev` or `production` (default: `dev`) |
| `CRON_SECRET` | No | Secret for cron authentication |

*Required for uptime monitoring functionality

---

## Technical Stack

- **Framework**: Next.js 15.3 (App Router)
- **Styling**: CSS Modules + Inline Styles
- **State**: React hooks + URL params
- **XMTP**: `@xmtp/node-sdk` (backend) + `@xmtp/browser-sdk` (frontend)
- **Wallet**: wagmi + OnchainKit MiniKit
- **Deployment**: Vercel (with Cron)

---

## Learn More

- [XMTP Documentation](https://docs.xmtp.org)
- [OnchainKit Documentation](https://onchainkit.xyz)
- [Base Mini Apps Guide](https://docs.base.org/docs/mini-apps/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Add your agent or feature
4. Commit your changes (`git commit -m "Add my feature"`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.
