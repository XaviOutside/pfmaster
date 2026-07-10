import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env['SENTRY_DSN'];
  if (!dsn) {
    console.warn('SENTRY_DSN not set — Sentry is disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env['NODE_ENV'] ?? 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.3 : 1.0,
    profilesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      ...(process.env['NODE_ENV'] === 'production' ? [nodeProfilingIntegration()] : []),
    ],
    beforeSend(event) {
      // Don't send events in development unless SENTRY_DEV_REPORTING is set
      if (process.env['NODE_ENV'] === 'development' && !process.env['SENTRY_DEV_REPORTING']) {
        return null;
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Creates a writable stream that forwards pino log entries to Sentry.
 * - error/fatal → Sentry.captureException
 * - warn       → Sentry.captureMessage (level: warning)
 * - info/debug  → Sentry.addBreadcrumb
 */
export function createSentryStream(): { write(chunk: string): void } {
  return {
    write(chunk: string) {
      // pino may write multiple JSON lines per chunk
      const lines = chunk.trim().split('\n');
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          const pinoLevel = log.level as number; // 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal

          // Clean up pino-internal noise from extra data
          const { level, time, pid, hostname, msg, err, ...extra } = log;
          const message: string = typeof msg === 'string' ? msg : JSON.stringify(msg);

          if (pinoLevel >= 50) {
            // error or fatal
            const error = err
              ? new Error(typeof err === 'string' ? err : err.message ?? message)
              : new Error(message);
            Sentry.captureException(error, {
              level: 'error',
              extra: { ...extra, pinoLevel, hostname },
            });
          } else if (pinoLevel >= 40) {
            // warn
            Sentry.captureMessage(message, {
              level: 'warning',
              extra: { ...extra, pinoLevel },
            });
          } else {
            // info, debug, trace → breadcrumb
            Sentry.addBreadcrumb({
              category: 'log',
              message: message || '(no message)',
              level: pinoLevel >= 30 ? 'info' : 'debug',
              data: extra,
            });
          }
        } catch {
          // Parse error — silently skip (this stream must never throw)
        }
      }
    },
  };
}
