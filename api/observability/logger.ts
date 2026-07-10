import pino from 'pino';
import { createSentryStream } from './sentry';

const isDevelopment = process.env['NODE_ENV'] === 'development';

const streams: pino.StreamEntry[] = [];

// Pretty-print stream for development
if (isDevelopment) {
  streams.push({
    level: (process.env['LOG_LEVEL'] ?? 'info') as pino.Level,
    stream: pino.transport({ target: 'pino-pretty', options: { colorize: true } }),
  });
} else {
  // Plain stdout for production (Docker captures it)
  streams.push({
    level: (process.env['LOG_LEVEL'] ?? 'info') as pino.Level,
    stream: process.stdout,
  });
}

// Sentry stream — always active, but createSentryStream handles missing DSN gracefully
streams.push({
  level: 'info',
  stream: createSentryStream(),
});

export const logger = pino(
  { level: process.env['LOG_LEVEL'] ?? 'info' },
  pino.multistream(streams),
);
