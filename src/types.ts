/**
 * Shared type definitions for DJD Agent Score MCP server.
 */

// --- Score API responses ---

export interface BasicScoreResponse {
  score: number;
  tier: string;
  confidence: number;
  recommendation: string;
  modelVersion: string;
}

export interface DimensionBreakdown {
  reliability: number;
  viability: number;
  identity: number;
  capability: number;
}

export interface IntegrityFlags {
  [key: string]: boolean | string | number;
}

export interface DataQuality {
  [key: string]: unknown;
}

export interface FullScoreResponse {
  score: number;
  tier: string;
  confidence: number;
  recommendation: string;
  modelVersion: string;
  dimensions: DimensionBreakdown;
  integrityFlags: IntegrityFlags;
  dataQuality: DataQuality;
}

export interface RefreshScoreResponse {
  score: number;
  tier: string;
  confidence: number;
  recommendation: string;
  modelVersion: string;
  refreshedAt: string;
}

// --- Fraud / Blacklist ---

export interface FraudReportRequest {
  wallet: string;
  txHashes: string[];
  evidence: string;
}

export interface FraudReportResponse {
  success: boolean;
  reportId?: string;
  message?: string;
}

export interface BlacklistResponse {
  wallet: string;
  reported: boolean;
  reportCount?: number;
  reports?: Array<{
    reportId: string;
    txHashes: string[];
    createdAt: string;
  }>;
}

// --- Leaderboard ---

export interface LeaderboardEntry {
  wallet: string;
  score: number;
  tier: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

// --- Agent Registration ---

export interface RegisterAgentRequest {
  wallet: string;
  name: string;
  description: string;
  githubUrl?: string;
}

export interface RegisterAgentResponse {
  success: boolean;
  message?: string;
}

// --- Health ---

export interface HealthResponse {
  status: string;
  version?: string;
  uptime?: number;
}

// --- Config ---

export interface ServerConfig {
  baseUrl: string;
  timeoutMs: number;
}
