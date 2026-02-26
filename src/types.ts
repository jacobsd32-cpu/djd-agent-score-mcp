/**
 * Shared type definitions for DJD Agent Score MCP server.
 *
 * These mirror the v2.3 REST API response shapes so the passthrough
 * `apiRequest<T>()` generic is accurate.
 */

// --- Score API responses ---

export interface BasicScoreResponse {
  wallet: string;
  score: number;
  tier: string;
  confidence: number;
  recommendation: string;
  modelVersion: string;
  lastUpdated: string;
  computedAt: string;
  scoreFreshness: number;
}

// --- Dimension data (v2.3) ---

export interface ReliabilityData {
  txCount: number;
  nonce: number;
  successRate: number;
  lastTxTimestamp: number | null;
  failedTxCount: number;
  uptimeEstimate: number;
}

export interface ViabilityData {
  usdcBalance: string;
  ethBalance: string;
  inflows30d: string;
  outflows30d: string;
  inflows7d: string;
  outflows7d: string;
  totalInflows: string;
  walletAgedays: number;
  everZeroBalance: boolean;
}

export interface IdentityData {
  erc8004Registered: boolean;
  hasBasename: boolean;
  walletAgeDays: number;
  creatorScore: number | null;
  generationDepth: number;
  constitutionHashVerified: boolean;
  /** Whether the wallet passed Insumer token-gating verification (v2.3+). */
  insumerVerified: boolean;
}

export interface CapabilityData {
  activeX402Services: number;
  totalRevenue: string;
  domainsOwned: number;
  successfulReplications: number;
  uniqueCounterparties: number;
  serviceLongevityDays: number;
}

export interface ScoreDimensions {
  reliability: { score: number; data: ReliabilityData };
  viability: { score: number; data: ViabilityData };
  identity: { score: number; data: IdentityData };
  capability: { score: number; data: CapabilityData };
}

export interface DataAvailability {
  transactionHistory: string;
  walletAge: string;
  economicData: string;
  identityData: string;
  communityData: string;
}

export interface ScoreHistoryEntry {
  score: number;
  calculatedAt: string;
  modelVersion?: string;
}

export interface FullScoreResponse extends BasicScoreResponse {
  sybilFlag: boolean;
  gamingIndicators: string[];
  dimensions: ScoreDimensions;
  dataAvailability: DataAvailability;
  improvementPath?: string[];
  scoreHistory: ScoreHistoryEntry[];
  integrityMultiplier?: number;
  breakdown?: Record<string, Record<string, number>>;
  scoreRange?: { low: number; high: number };
  topContributors?: string[];
  topDetractors?: string[];
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
