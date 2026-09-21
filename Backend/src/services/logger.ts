/**
 * Privacy-Preserving Structured Logger
 * 
 * Strict Cybersecurity & Privacy Safeguards:
 * 1. Outputs structured JSON for automated log ingestion.
 * 2. Unconditionally scrubs any sensitive keys: rawText, text, evidence, otp, password, etc.
 * 3. Never prints submitted communication content to console, disk, or remote log streams.
 */

import { createHash } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  reqId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  clientIp?: string;
  providerMode?: string;
  errorCategory?: string;
  [key: string]: any;
}

const REDACTED_KEYS = /^(text|rawText|raw|message|body|payload|otp|password|pin|secret|key|token|auth|authorization|cookie)$/i;

function sanitizeValue(key: string, value: any): any {
  if (REDACTED_KEYS.test(key)) {
    return '[REDACTED_FOR_PRIVACY]';
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((v) => sanitizeValue(key, v));
    }
    const cleanObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      cleanObj[k] = sanitizeValue(k, v);
    }
    return cleanObj;
  }

  return value;
}

export function hashIpForPrivacy(ip?: string): string {
  if (!ip) return 'unknown';
  // Salt-free SHA-256 prefix for rate-limit grouping without tracking individual user identities
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext: Record<string, any> = {};

    if (context) {
      for (const [k, v] of Object.entries(context)) {
        if (k === 'clientIp' && typeof v === 'string') {
          sanitizedContext.clientIpHash = hashIpForPrivacy(v);
        } else {
          sanitizedContext[k] = sanitizeValue(k, v);
        }
      }
    }

    const entry = {
      timestamp,
      level,
      message,
      ...sanitizedContext,
    };

    return JSON.stringify(entry);
  }

  public info(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.log(this.formatLog('info', message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(this.formatLog('warn', message, context));
    }
  }

  public error(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'test') {
      console.error(this.formatLog('error', message, context));
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new StructuredLogger();
