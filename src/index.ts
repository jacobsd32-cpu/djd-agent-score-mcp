#!/usr/bin/env node
/**
 * DJD Agent Score MCP Server
 *
 * Exposes the DJD Agent Score REST API as MCP tools so any MCP-compatible
 * agent can natively call scoring, fraud, and registration endpoints.
 *
 * Transports:
 *   - stdio  (default) — for Claude Desktop, Cursor, local agents
 *   - http   (TRANSPORT=http) — for remote agents via Streamable HTTP
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { setConfig } from "./client.js";
import { registerTools } from "./tools.js";

// ── Configuration ───────────────────────────────────────────────────

const BASE_URL = process.env.DJD_BASE_URL || "https://djd-agent-score.fly.dev";
const TIMEOUT_MS = parseInt(process.env.DJD_TIMEOUT_MS || "10000", 10);
const PORT = parseInt(process.env.PORT || "3000", 10);
const TRANSPORT = process.env.TRANSPORT || "stdio";

setConfig({ baseUrl: BASE_URL, timeoutMs: TIMEOUT_MS });

// ── Server setup ────────────────────────────────────────────────────

const server = new McpServer({
  name: "djd-agent-score-mcp-server",
  version: "1.0.0",
});

registerTools(server);

// ── Transport: stdio ────────────────────────────────────────────────

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`DJD Agent Score MCP server running via stdio (API: ${BASE_URL})`);
}

// ── Transport: Streamable HTTP ──────────────────────────────────────

async function runHttp(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "djd-agent-score-mcp-server", version: "1.0.0" });
  });

  app.listen(PORT, () => {
    console.error(`DJD Agent Score MCP server running on http://localhost:${PORT}/mcp (API: ${BASE_URL})`);
  });
}

// ── Entrypoint ──────────────────────────────────────────────────────

// ── Smithery sandbox (tool scanning during publish) ─────────────

export function createSandboxServer(): McpServer {
  const sandbox = new McpServer({
    name: "djd-agent-score-mcp-server",
    version: "1.0.0",
  });
  registerTools(sandbox);
  return sandbox;
}

if (TRANSPORT === "http") {
  runHttp().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
