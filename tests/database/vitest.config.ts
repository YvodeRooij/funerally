import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'database-tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./setup/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    sequence: {
      hooks: 'parallel',
      concurrent: false, // Database tests should run sequentially
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Ensure single database connection
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['**/*.test.ts', '**/*.spec.ts'],
      exclude: [
        'node_modules/**',
        'coverage/**',
        'setup/**',
        'utils/**',
        'fixtures/**',
      ],
    },
    outputFile: {
      json: './reports/database-test-results.json',
      junit: './reports/database-test-results.xml',
    },
    reporters: ['verbose', 'json', 'junit'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../'),
      '@db': resolve(__dirname, '../../db'),
      '@lib': resolve(__dirname, '../../lib'),
      '@tests': resolve(__dirname, '../'),
    },
  },
});