import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for integration tests.
 * Runs only *.integration.test.ts files — requires Docker MySQL running.
 *
 * Usage: npm run test:integration
 */
export default defineConfig({
  test: {
    include: ['api/**/*.integration.test.ts'],
    environment: 'node',
    // Sequential execution avoids race conditions on shared DB tables
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Longer timeout for DB operations
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, 'api'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
