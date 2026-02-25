/**
 * HTTP client wrapper for the DJD Agent Score REST API.
 *
 * Uses native fetch (Node 18+) with configurable base URL and timeout.
 * Handles x402 payment-required responses gracefully so callers can
 * relay the payment instruction back to the agent.
 */

import type { ServerConfig } from "./types.js";

const DEFAULT_CONFIG: ServerConfig = {
  baseUrl: process.env.DJD_BASE_URL || "https://djd-agent-score.fly.dev",
  timeoutMs: 10_000,
};

let config: ServerConfig = { ...DEFAULT_CONFIG };

export function setConfig(overrides: Partial<ServerConfig>): void {
  config = { ...config, ...overrides };
}

export function getConfig(): ServerConfig {
  return { ...config };
}

// ── Generic request helper ──────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST";
  path: string;
  params?: Record<string, string>;
  body?: unknown;
}

export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  const { method = "GET", path, params, body } = opts;

  const url = new URL(path, config.baseUrl);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // x402 payment required — surface details so the agent can handle it
    if (response.status === 402) {
      const text = await response.text();
      throw new ApiError(
        `Payment required (HTTP 402). This is a paid endpoint that requires x402 payment. ` +
          `Your agent framework must handle the 402 response and provide payment. ` +
          `Details: ${text}`,
        402
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(
        `API request failed with status ${response.status}: ${text}`,
        response.status
      );
    }

    // Some endpoints (badge SVG) return non-JSON
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${config.timeoutMs}ms. Try again or increase timeout.`,
        0
      );
    }

    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
      0
    );
  } finally {
    clearTimeout(timer);
  }
}

// ── Custom error class ──────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
}
