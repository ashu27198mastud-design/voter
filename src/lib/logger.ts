/**
 * Google Cloud Structured Logging Utility
 * Automatically formats logs as JSON for Cloud Logging when running in production.
 */

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export function log(message: string, severity: LogLevel = 'INFO', payload: Record<string, unknown> = {}) {
  const logEntry = {
    message,
    severity,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (process.env.NODE_ENV === 'production') {
    // Cloud Logging parses stdout JSON
    console.log(JSON.stringify(logEntry));
  } else {
    // Human-readable in development
    const color = severity === 'ERROR' ? '\x1b[31m' : severity === 'WARNING' ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${severity}]\x1b[0m ${message}`, Object.keys(payload).length ? payload : '');
  }
}

export const logger = {
  info: (msg: string, payload?: Record<string, unknown>) => log(msg, 'INFO', payload),
  warn: (msg: string, payload?: Record<string, unknown>) => log(msg, 'WARNING', payload),
  error: (msg: string, payload?: Record<string, unknown>) => log(msg, 'ERROR', payload),
  critical: (msg: string, payload?: Record<string, unknown>) => log(msg, 'CRITICAL', payload),
};
