import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    slowTestThreshold: 15_000, // concurrency is a load test — don't flag it as slow
    coverage: {
      provider: 'v8',
      reportsDirectory: 'reports/coverage',
      reporter: ['text', 'json', 'html'],
    },
  },
});
