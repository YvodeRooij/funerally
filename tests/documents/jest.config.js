/**
 * Jest configuration for Document Security Tests
 */

module.exports = {
  displayName: 'Document Security Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/**/*.test.{js,ts}',
    '<rootDir>/**/*.spec.{js,ts}'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  collectCoverageFrom: [
    '../../lib/documents/**/*.{js,ts}',
    '!../../lib/documents/**/*.d.ts',
    '!../../lib/documents/**/types.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  detectLeaks: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@lib/(.*)$': '<rootDir>/../../lib/$1',
    '^@components/(.*)$': '<rootDir>/../../components/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true
        }
      }
    }
  }
};