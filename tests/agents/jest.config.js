/**
 * Jest Configuration for Agent Testing
 * 
 * Optimized configuration for LangGraph agent testing with
 * TypeScript support, coverage reporting, and test utilities.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>'],
  
  // TypeScript support
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.(ts|js)',
    '**/?(*.)+(spec|test).(ts|js)'
  ],
  
  // Module resolution
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@agents/(.*)$': '<rootDir>/../../lib/agents/$1',
    '^@tests/(.*)$': '<rootDir>/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020'
      }
    }]
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/utils/test-setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './workflow/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './cultural/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './human-loop/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './integration/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '../../lib/agents/**/*.ts',
    '!../../lib/agents/**/*.d.ts',
    '!../../lib/agents/**/index.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Test timeouts
  testTimeout: 30000, // 30 seconds for integration tests
  
  // Global setup and teardown
  globalSetup: '<rootDir>/utils/global-setup.ts',
  globalTeardown: '<rootDir>/utils/global-teardown.ts',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/reports',
        filename: 'agent-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Farewelly Agent Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports',
        outputName: 'agent-test-results.xml',
        suiteName: 'Farewelly Agent Tests'
      }
    ]
  ],
  
  // Test patterns to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '/dist/',
    '/build/'
  ],
  
  // Verbose output
  verbose: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Maximum worker processes
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test result processor
  testResultsProcessor: '<rootDir>/utils/test-results-processor.js',
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Additional options for specific test types
  projects: [
    {
      displayName: 'workflow',
      testMatch: ['<rootDir>/workflow/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/utils/workflow-test-setup.ts']
    },
    {
      displayName: 'cultural',
      testMatch: ['<rootDir>/cultural/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/utils/cultural-test-setup.ts']
    },
    {
      displayName: 'human-loop',
      testMatch: ['<rootDir>/human-loop/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/utils/human-loop-test-setup.ts']
    },
    {
      displayName: 'state-management',
      testMatch: ['<rootDir>/state-management/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/utils/state-management-test-setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/utils/integration-test-setup.ts'],
      testTimeout: 60000 // Longer timeout for integration tests
    }
  ]
};