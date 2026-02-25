/**
 * MCP tool definitions for DJD Agent Score.
 *
 * Each tool wraps one REST API endpoint with typed Zod schemas,
 * clear descriptions, and proper MCP annotations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiRequest, formatError } from "./client.js";
import type {
  BasicScoreResponse,
  FullScoreResponse,
  RefreshScoreResponse,
  FraudReportResponse,
  BlacklistResponse,
  LeaderboardEntry,
  RegisterAgentResponse,
  HealthResponse,
} from "./types.js";

// ── Shared schemas ──────────────────────────────────────────────────

const WalletSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address (0x + 40 hex chars)")
  .describe("Ethereum wallet address (e.g. 0xAbC...123)");

// ── Helpers ─────────────────────────────────────────────────────────

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function err(error: unknown) {
  return { isError: true as const, content: [{ type: "text" as const, text: formatError(error) }] };
}

// ── Register all tools ──────────────────────────────────────────────

export function registerTools(server: McpServer): void {
  // 1. score_basic ────────────────────────────────────────────────────
  server.registerTool(
    "score_basic",
    {
      title: "Basic Agent Score",
      description: `Get the basic reputation score for an AI agent wallet on Base.

Returns a numeric score (0-1000), tier (e.g. "Trusted", "Neutral", "Risky"),
confidence level, recommendation text, and model version.

This is a FREE endpoint — no x402 payment required.

Args:
  - wallet (string): Ethereum wallet address (0x + 40 hex chars)

Returns:
  { score, tier, confidence, recommendation, modelVersion }

Examples:
  - "What's the reputation of 0xABC...?" -> score_basic with that wallet
  - "Is this agent wallet trustworthy?" -> score_basic to get tier/recommendation`,
      inputSchema: { wallet: WalletSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ wallet }) => {
      try {
        const data = await apiRequest<BasicScoreResponse>({
          path: "/v1/score/basic",
          params: { wallet },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 2. score_full ─────────────────────────────────────────────────────
  server.registerTool(
    "score_full",
    {
      title: "Full Agent Score",
      description: `Get the full reputation score with dimension breakdown for an AI agent wallet.

Returns everything from basic score PLUS:
  - dimensions: { reliability, viability, identity, capability }
  - integrityFlags: flags about suspicious activity
  - dataQuality: metrics about data completeness

PAID endpoint — requires x402 payment ($0.10 USD). If your agent framework
supports x402, the 402 response will contain payment instructions. Complete
the payment and retry the request.

Args:
  - wallet (string): Ethereum wallet address (0x + 40 hex chars)

Returns:
  { score, tier, confidence, recommendation, modelVersion,
    dimensions, integrityFlags, dataQuality }`,
      inputSchema: { wallet: WalletSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ wallet }) => {
      try {
        const data = await apiRequest<FullScoreResponse>({
          path: "/v1/score/full",
          params: { wallet },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 3. score_refresh ──────────────────────────────────────────────────
  server.registerTool(
    "score_refresh",
    {
      title: "Refresh Agent Score",
      description: `Force a re-score of an AI agent wallet using the latest on-chain data.

Use this when you suspect the cached score is stale or after known
on-chain activity that should change the score.

PAID endpoint — requires x402 payment ($0.25 USD).

Args:
  - wallet (string): Ethereum wallet address (0x + 40 hex chars)

Returns:
  { score, tier, confidence, recommendation, modelVersion, refreshedAt }`,
      inputSchema: { wallet: WalletSchema },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ wallet }) => {
      try {
        const data = await apiRequest<RefreshScoreResponse>({
          path: "/v1/score/refresh",
          params: { wallet },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 4. report_fraud ───────────────────────────────────────────────────
  server.registerTool(
    "report_fraud",
    {
      title: "Report Fraud",
      description: `Submit a fraud report for a wallet with supporting transaction hashes and evidence.

PAID endpoint — requires x402 payment ($0.02 USD).

Args:
  - wallet (string): Ethereum wallet address of the suspected fraudster
  - tx_hashes (string[]): Array of transaction hashes as evidence
  - evidence (string): Text description of the fraudulent behavior

Returns:
  { success, reportId, message }`,
      inputSchema: {
        wallet: WalletSchema,
        tx_hashes: z
          .array(z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid tx hash"))
          .min(1, "At least one transaction hash is required")
          .describe("Transaction hashes that demonstrate the fraudulent behavior"),
        evidence: z
          .string()
          .min(10, "Evidence must be at least 10 characters")
          .max(5000, "Evidence must not exceed 5000 characters")
          .describe("Text description of the fraudulent behavior"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ wallet, tx_hashes, evidence }) => {
      try {
        const data = await apiRequest<FraudReportResponse>({
          method: "POST",
          path: "/v1/report",
          body: { wallet, txHashes: tx_hashes, evidence },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 5. check_blacklist ────────────────────────────────────────────────
  server.registerTool(
    "check_blacklist",
    {
      title: "Check Fraud Blacklist",
      description: `Check if a wallet has any fraud reports filed against it.

PAID endpoint — requires x402 payment ($0.05 USD).

Args:
  - wallet (string): Ethereum wallet address to check

Returns:
  { wallet, reported, reportCount, reports[] }`,
      inputSchema: { wallet: WalletSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ wallet }) => {
      try {
        const data = await apiRequest<BlacklistResponse>({
          path: "/v1/data/fraud/blacklist",
          params: { wallet },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 6. get_badge ──────────────────────────────────────────────────────
  server.registerTool(
    "get_badge",
    {
      title: "Get Score Badge",
      description: `Get the embeddable SVG badge URL for a wallet's reputation score.

Returns the badge endpoint URL and the raw SVG content. The URL can be
embedded in markdown, HTML, or any context that supports images.

This is a FREE endpoint.

Args:
  - wallet (string): Ethereum wallet address

Returns:
  { badgeUrl, svg }`,
      inputSchema: { wallet: WalletSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ wallet }) => {
      try {
        const badgeUrl = `${(await import("./client.js")).getConfig().baseUrl}/v1/badge/${wallet}.svg`;
        const svg = await apiRequest<string>({
          path: `/v1/badge/${wallet}.svg`,
        });
        return ok(JSON.stringify({ badgeUrl, svg }, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 7. get_leaderboard ────────────────────────────────────────────────
  server.registerTool(
    "get_leaderboard",
    {
      title: "Get Leaderboard",
      description: `Get the leaderboard of top-scored AI agent wallets.

Returns a ranked list of wallets with their scores and tiers.

This is a FREE endpoint.

Returns:
  Array of { wallet, score, tier }`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const data = await apiRequest<LeaderboardEntry[] | { entries: LeaderboardEntry[] }>({
          path: "/v1/leaderboard",
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 8. register_agent ─────────────────────────────────────────────────
  server.registerTool(
    "register_agent",
    {
      title: "Register Agent",
      description: `Register an AI agent wallet with metadata (name, description, optional GitHub URL).

This is a FREE endpoint.

Args:
  - wallet (string): Ethereum wallet address to register
  - name (string): Display name for the agent
  - description (string): What this agent does
  - github_url (string, optional): GitHub repository URL

Returns:
  { success, message }`,
      inputSchema: {
        wallet: WalletSchema,
        name: z
          .string()
          .min(1, "Name is required")
          .max(100, "Name must not exceed 100 characters")
          .describe("Display name for the agent"),
        description: z
          .string()
          .min(1, "Description is required")
          .max(1000, "Description must not exceed 1000 characters")
          .describe("What this agent does"),
        github_url: z
          .string()
          .url("Must be a valid URL")
          .optional()
          .describe("GitHub repository URL for the agent (optional)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ wallet, name, description, github_url }) => {
      try {
        const data = await apiRequest<RegisterAgentResponse>({
          method: "POST",
          path: "/v1/agent/register",
          body: {
            wallet,
            name,
            description,
            ...(github_url ? { githubUrl: github_url } : {}),
          },
        });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );

  // 9. health_check ───────────────────────────────────────────────────
  server.registerTool(
    "health_check",
    {
      title: "Health Check",
      description: `Check the DJD Agent Score API system status.

This is a FREE endpoint.

Returns:
  { status, version, uptime }`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const data = await apiRequest<HealthResponse>({ path: "/health" });
        return ok(JSON.stringify(data, null, 2));
      } catch (error) {
        return err(error);
      }
    }
  );
}
