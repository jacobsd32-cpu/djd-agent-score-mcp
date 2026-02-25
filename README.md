# djd-agent-score-mcp

MCP server for **DJD Agent Score** — a reputation scoring API for AI agent wallets on Base.

This server exposes the DJD Agent Score REST API as [Model Context Protocol](https://modelcontextprotocol.io/) tools, so any MCP-compatible agent (Claude, GPT, Gemini, LangChain, etc.) can call scoring endpoints natively.

## Tools

| Tool | Endpoint | Cost | Description |
|------|----------|------|-------------|
| `score_basic` | `GET /v1/score/basic` | Free | Basic score, tier, confidence |
| `score_full` | `GET /v1/score/full` | $0.10 (x402) | Full dimension breakdown |
| `score_refresh` | `GET /v1/score/refresh` | $0.25 (x402) | Re-score with latest chain data |
| `report_fraud` | `POST /v1/report` | $0.02 (x402) | Submit fraud report |
| `check_blacklist` | `GET /v1/data/fraud/blacklist` | $0.05 (x402) | Check fraud reports |
| `get_badge` | `GET /v1/badge/{wallet}.svg` | Free | Embeddable SVG badge |
| `get_leaderboard` | `GET /v1/leaderboard` | Free | Top scored wallets |
| `register_agent` | `POST /v1/agent/register` | Free | Register wallet with metadata |
| `health_check` | `GET /health` | Free | System status |

## Installation

```bash
npm install -g djd-agent-score-mcp
```

Or run directly with npx:

```bash
npx djd-agent-score-mcp
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "djd-agent-score": {
      "command": "npx",
      "args": ["-y", "djd-agent-score-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "djd-agent-score": {
      "command": "npx",
      "args": ["-y", "djd-agent-score-mcp"]
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "djd-agent-score": {
      "command": "npx",
      "args": ["-y", "djd-agent-score-mcp"]
    }
  }
}
```

### Generic MCP Client (Streamable HTTP)

Start the server in HTTP mode:

```bash
TRANSPORT=http PORT=3000 npx djd-agent-score-mcp
```

Then connect your MCP client to `http://localhost:3000/mcp`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DJD_BASE_URL` | `https://djd-agent-score.fly.dev` | API base URL (use `http://localhost:3001` for local dev) |
| `DJD_TIMEOUT_MS` | `10000` | Request timeout in milliseconds |
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `3000` | HTTP server port (only used when `TRANSPORT=http`) |

## Development

```bash
git clone <repo-url>
cd djd-agent-score-mcp
npm install
npm run build
npm start
```

To point at a local API during development:

```bash
DJD_BASE_URL=http://localhost:3001 npm start
```

## x402 Payment

Some endpoints require x402 micropayments. When an agent calls a paid tool, the API responds with HTTP 402 and payment instructions. Your agent framework must:

1. Detect the 402 response
2. Complete the x402 payment (USDC on Base)
3. Retry the request with the payment proof

The MCP server surfaces the 402 details in the tool's error response so the agent can handle it.

## License

MIT
