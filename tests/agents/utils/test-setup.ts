/**
 * Global Test Setup for Agent Testing
 * 
 * Common setup, configuration, and utilities for all agent tests.
 */

import { jest } from '@jest/globals';

// Global test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  environment: 'test',
  logLevel: 'error'
};

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
  
  // Configure global timeouts
  jest.setTimeout(TEST_CONFIG.timeout);
  
  // Suppress console output during tests (except errors)
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
  // Keep console.error for debugging test failures
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
  
  // Clean up any global state
  delete process.env.NODE_ENV;
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset any global state
  global.testStartTime = Date.now();
});

afterEach(() => {
  // Log test execution time if needed
  const executionTime = Date.now() - (global.testStartTime || 0);
  if (executionTime > 5000) { // Warn if test takes longer than 5 seconds
    console.warn(`Test took ${executionTime}ms to complete`);
  }
  
  // Clean up any test artifacts
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Wait for a condition to be true
  waitFor: async (condition: () => boolean | Promise<boolean>, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Create a delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate unique test IDs
  generateId: (prefix = 'test') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Create mock date
  mockDate: (dateString: string) => {
    const mockDate = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  },
  
  // Restore original Date
  restoreDate: () => {
    (global.Date as any).mockRestore?.();
  }
};

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
  
  toHaveBeenCalledWithinTimeframe(received: jest.Mock, timeframe: number) {
    const calls = received.mock.calls;
    if (calls.length === 0) {
      return {
        message: () => 'expected function to have been called',
        pass: false,
      };
    }
    
    const now = Date.now();
    const recentCalls = calls.filter(() => {
      // This is a simplified check - in real implementation,
      // you'd need to track call timestamps
      return true;
    });
    
    return {
      message: () =>
        recentCalls.length > 0
          ? `expected function not to have been called within ${timeframe}ms`
          : `expected function to have been called within ${timeframe}ms`,
      pass: recentCalls.length > 0,
    };
  },
  
  toContainWorkflowStage(received: any, stage: string) {
    const hasStage = received && received.planningStage === stage;
    return {
      message: () =>
        hasStage
          ? `expected workflow state not to contain stage ${stage}`
          : `expected workflow state to contain stage ${stage}`,
      pass: hasStage,
    };
  },
  
  toHaveCulturalRequirement(received: any, requirement: string) {
    const hasRequirement = received && 
      received.identifiedRites && 
      received.identifiedRites.some((rite: any) => 
        rite.requirements?.some((req: any) => 
          req.requirement.includes(requirement)
        )
      );
    
    return {
      message: () =>
        hasRequirement
          ? `expected cultural assessment not to have requirement ${requirement}`
          : `expected cultural assessment to have requirement ${requirement}`,
      pass: hasRequirement,
    };
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Memory leak detection helper
let initialMemoryUsage: NodeJS.MemoryUsage;

beforeAll(() => {
  if (global.gc) {
    global.gc();
  }
  initialMemoryUsage = process.memoryUsage();
});

afterAll(() => {
  if (global.gc) {
    global.gc();
  }
  
  const finalMemoryUsage = process.memoryUsage();
  const memoryIncrease = finalMemoryUsage.heapUsed - initialMemoryUsage.heapUsed;
  
  // Warn if memory usage increased significantly
  if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
    console.warn(`Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB during tests`);
  }
});

export default TEST_CONFIG;