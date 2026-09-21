/**
 * Environment Configuration & Startup Validation
 * 
 * Validates critical environment variables at boot.
 * Protects secrets from being printed to logs or error outputs.
 */

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsAllowedOrigins: string[];
  openaiApiKey?: string;
  hasRealAi: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  trustProxy: boolean;
  maxPayloadSizeBytes: number;
  maxTextLengthChars: number;
}

export function loadAndValidateConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase() as
    | 'development'
    | 'production'
    | 'test';

  const port = parseInt(process.env.PORT || '3001', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT configuration: "${process.env.PORT}". Must be a number between 1 and 65535.`);
  }

  // Parse CORS allowed origins (comma-separated or defaults)
  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const customOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const corsAllowedOrigins = customOrigins.length > 0 ? customOrigins : defaultOrigins;

  // Validate OpenAI Key safely (check presence & basic format without logging value)
  const rawKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : undefined;
  const hasRealAi = !!(rawKey && rawKey.length > 10);

  // Rate Limiting Defaults (Configurable via ENV)
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10);
  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

  // Security bounds
  const maxPayloadSizeBytes = 50 * 1024; // 50 KB max request body
  const maxTextLengthChars = 10000; // 10,000 characters max investigation input

  return {
    port,
    nodeEnv,
    corsAllowedOrigins,
    openaiApiKey: rawKey,
    hasRealAi,
    rateLimitWindowMs: isNaN(rateLimitWindowMs) ? 60000 : rateLimitWindowMs,
    rateLimitMaxRequests: isNaN(rateLimitMaxRequests) ? 60 : rateLimitMaxRequests,
    trustProxy,
    maxPayloadSizeBytes,
    maxTextLengthChars,
  };
}

export const config = loadAndValidateConfig();
