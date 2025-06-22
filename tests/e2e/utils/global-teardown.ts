import { FullConfig } from '@playwright/test';
import { DatabaseHelpers } from './test-helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global teardown for Farewelly E2E tests
 * Handles cleanup, report generation, and environment restoration
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Farewelly E2E tests...');

  try {
    // Clean up test data from database
    await DatabaseHelpers.cleanupTestData();

    // Clean up authentication files
    const authFiles = [
      'tests/e2e/fixtures/auth.json',
      'tests/e2e/fixtures/family-auth.json',
      'tests/e2e/fixtures/director-auth.json',
      'tests/e2e/fixtures/venue-auth.json'
    ];

    for (const authFile of authFiles) {
      if (fs.existsSync(authFile)) {
        fs.unlinkSync(authFile);
      }
    }

    // Generate test summary report
    await generateTestSummaryReport();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown as it might mask test failures
  }
}

/**
 * Generate comprehensive test summary report
 */
async function generateTestSummaryReport() {
  try {
    const reportsDir = 'tests/e2e/reports';
    const summaryPath = path.join(reportsDir, 'test-summary.json');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      testRun: {
        environment: process.env.NODE_ENV || 'test',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        browser: 'chromium', // Default browser for summary
        userAgent: 'Playwright E2E Tests'
      },
      coverage: {
        userJourneys: [
          'Family user registration and funeral planning',
          'Director client management and scheduling',
          'Venue availability and booking management',
          'Cross-platform responsive functionality',
          'Integration between all user types',
          'Payment processing and document sharing',
          'Error handling and recovery scenarios'
        ],
        testTypes: [
          'User journey tests',
          'Cross-platform tests',
          'Integration tests',
          'Business process tests',
          'Error scenario tests'
        ]
      },
      artifacts: {
        screenshots: 'tests/e2e/reports/screenshots/',
        videos: 'tests/e2e/reports/videos/',
        traces: 'tests/e2e/reports/traces/',
        htmlReport: 'tests/e2e/reports/html/',
        jsonResults: 'tests/e2e/reports/results.json',
        junitResults: 'tests/e2e/reports/results.xml'
      },
      recommendations: [
        'Run tests on CI/CD pipeline for continuous validation',
        'Monitor test execution times and optimize slow tests',
        'Review failed tests and update assertions as needed',
        'Extend test coverage for new features and edge cases',
        'Regular review of test data and cleanup procedures'
      ]
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('📊 Test summary report generated:', summaryPath);
  } catch (error) {
    console.error('❌ Failed to generate test summary report:', error);
  }
}

export default globalTeardown;