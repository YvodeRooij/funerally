import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * Comprehensive Playwright configuration for Farewelly E2E testing
 * Supports multiple user types, cross-platform testing, and error scenarios
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports/html' }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
    ['junit', { outputFile: 'tests/e2e/reports/results.xml' }],
    ['line']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for all actions */
    actionTimeout: 30 * 1000,

    /* Global timeout for navigation */
    navigationTimeout: 60 * 1000,
  },

  /* Configure projects for major browsers and devices */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    // Tablet devices
    {
      name: 'Tablet Chrome',
      use: { 
        ...devices['iPad Pro'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    // Specialized test projects
    {
      name: 'family-user-journey',
      testDir: './tests/e2e/family',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/family-auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'director-workflow',
      testDir: './tests/e2e/director',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/director-auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'venue-management',
      testDir: './tests/e2e/venue',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/venue-auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'integration-tests',
      testDir: './tests/e2e/integration',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },

    {
      name: 'error-scenarios',
      testDir: './tests/e2e/error-scenarios',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/utils/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/utils/global-teardown.ts'),

  /* Test timeout */
  timeout: 5 * 60 * 1000, // 5 minutes

  /* Expect timeout */
  expect: {
    timeout: 30 * 1000, // 30 seconds
  },
});