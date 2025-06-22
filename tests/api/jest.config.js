/**
 * Jest Configuration for API Testing
 * Comprehensive configuration for all API endpoint testing
 */

module.exports = {
  displayName: 'API Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/api/**/*.test.ts',
    '<rootDir>/tests/api/**/*.test.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/api/setup/global-setup.ts',
  ],
  globalSetup: '<rootDir>/tests/api/setup/jest-global-setup.ts',
  globalTeardown: '<rootDir>/tests/api/setup/jest-global-teardown.ts',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageDirectory: '<rootDir>/tests/api/coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000, // 30 seconds for API tests
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Test categorization
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/api/**/unit/*.test.ts'],
      testTimeout: 5000,
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/api/**/integration/*.test.ts'],
      testTimeout: 15000,
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/tests/api/security/*.test.ts'],
      testTimeout: 10000,
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/tests/api/performance/*.test.ts'],
      testTimeout: 60000,
    },
  ],
  
  // Environment variables for testing
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/farewelly_test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './tests/api/reports',
        filename: 'api-test-report.html',
        openReport: false,
        pageTitle: 'Farewelly API Test Report',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './tests/api/reports',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  
  // Verbose output for debugging
  verbose: process.env.TEST_VERBOSE === 'true',
  
  // Bail settings
  bail: process.env.CI ? 1 : 0,
  
  // Retry failed tests
  retry: process.env.CI ? 2 : 0,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test data and fixtures
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/api/fixtures/',
    '<rootDir>/tests/api/utils/',
  ],
  
  // Watch mode settings
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/api/reports/',
    '<rootDir>/tests/api/coverage/',
  ],
}