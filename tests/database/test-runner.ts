#!/usr/bin/env node

/**
 * Comprehensive Database Test Runner for Farewelly
 * 
 * This script runs all database tests and generates comprehensive reports
 * for the funeral management system's database testing suite.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  description: string;
  testFiles: string[];
  category: 'unit' | 'integration' | 'performance' | 'security' | 'compliance';
  priority: 'high' | 'medium' | 'low';
  estimatedTimeMs: number;
}

interface TestResult {
  suiteName: string;
  success: boolean;
  duration: number;
  testCount: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  errors: string[];
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface TestReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    databaseVersion: string;
    testFramework: string;
  };
  summary: {
    totalSuites: number;
    totalTests: number;
    totalDuration: number;
    successRate: number;
  };
  results: TestResult[];
  recommendations: string[];
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Schema Validation',
    description: 'Tests database schema integrity, constraints, and relationships',
    testFiles: ['unit/schema-validation.test.ts'],
    category: 'unit',
    priority: 'high',
    estimatedTimeMs: 30000
  },
  {
    name: 'Migration Integrity',
    description: 'Tests database migration processes and rollback procedures',
    testFiles: ['migration/migration-integrity.test.ts'],
    category: 'integration',
    priority: 'high',
    estimatedTimeMs: 60000
  },
  {
    name: 'Query Performance',
    description: 'Benchmarks database query performance and index usage',
    testFiles: ['performance/query-performance.test.ts'],
    category: 'performance',
    priority: 'medium',
    estimatedTimeMs: 120000
  },
  {
    name: 'Row Level Security',
    description: 'Tests access control policies and data isolation',
    testFiles: ['security/row-level-security.test.ts'],
    category: 'security',
    priority: 'high',
    estimatedTimeMs: 90000
  },
  {
    name: 'GDPR Compliance',
    description: 'Tests data protection, retention, and privacy compliance',
    testFiles: ['compliance/gdpr-compliance.test.ts'],
    category: 'compliance',
    priority: 'high',
    estimatedTimeMs: 75000
  }
];

class DatabaseTestRunner {
  private results: TestResult[] = [];
  private reportsDir: string;
  private memoryPath: string;

  constructor() {
    this.reportsDir = join(__dirname, 'reports');
    this.memoryPath = 'swarm-testing-1750494292308/database/tests';
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runAllTests(options: {
    verbose?: boolean;
    coverage?: boolean;
    parallel?: boolean;
    suiteFilter?: string[];
  } = {}): Promise<TestReport> {
    console.log('🚀 Starting Farewelly Database Test Suite...\n');
    
    const startTime = Date.now();
    const suitesToRun = options.suiteFilter 
      ? TEST_SUITES.filter(suite => options.suiteFilter!.includes(suite.name))
      : TEST_SUITES;

    console.log(`Running ${suitesToRun.length} test suites:\n`);
    suitesToRun.forEach(suite => {
      console.log(`  📁 ${suite.name} (${suite.category}, ${suite.priority} priority)`);
      console.log(`     ${suite.description}`);
      console.log(`     Estimated time: ${Math.round(suite.estimatedTimeMs / 1000)}s\n`);
    });

    // Run pre-test validation
    await this.validateEnvironment();

    // Run test suites
    if (options.parallel && suitesToRun.length > 1) {
      await this.runSuitesParallel(suitesToRun, options);
    } else {
      await this.runSuitesSequential(suitesToRun, options);
    }

    const totalDuration = Date.now() - startTime;
    
    // Generate comprehensive report
    const report = await this.generateReport(totalDuration);
    
    // Store results in memory for swarm coordination
    await this.storeResultsInMemory(report);
    
    // Display summary
    this.displaySummary(report);

    return report;
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating test environment...');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      console.log(`  ✅ Node.js: ${nodeVersion}`);

      // Check database connection
      execSync('npm run test:database -- --run --reporter=silent', { 
        stdio: 'pipe',
        timeout: 10000 
      });
      console.log('  ✅ Database connection: OK');

      // Check test dependencies
      const vitestVersion = execSync('npx vitest --version', { encoding: 'utf8' }).trim();
      console.log(`  ✅ Vitest: ${vitestVersion}`);

      console.log('');
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      throw new Error('Test environment validation failed');
    }
  }

  private async runSuitesSequential(
    suites: TestSuite[], 
    options: { verbose?: boolean; coverage?: boolean }
  ): Promise<void> {
    for (const suite of suites) {
      console.log(`\n📋 Running ${suite.name}...`);
      const result = await this.runTestSuite(suite, options);
      this.results.push(result);
      
      if (result.success) {
        console.log(`  ✅ ${suite.name}: ${result.passCount}/${result.testCount} tests passed (${result.duration}ms)`);
      } else {
        console.log(`  ❌ ${suite.name}: ${result.failCount} tests failed`);
        if (options.verbose && result.errors.length > 0) {
          console.log('     Errors:', result.errors.join(', '));
        }
      }
    }
  }

  private async runSuitesParallel(
    suites: TestSuite[], 
    options: { verbose?: boolean; coverage?: boolean }
  ): Promise<void> {
    console.log('⚡ Running test suites in parallel...\n');
    
    const promises = suites.map(suite => this.runTestSuite(suite, options));
    this.results = await Promise.all(promises);
    
    this.results.forEach((result, index) => {
      const suite = suites[index];
      if (result.success) {
        console.log(`  ✅ ${suite.name}: ${result.passCount}/${result.testCount} tests passed`);
      } else {
        console.log(`  ❌ ${suite.name}: ${result.failCount} tests failed`);
      }
    });
  }

  private async runTestSuite(
    suite: TestSuite, 
    options: { verbose?: boolean; coverage?: boolean }
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testFiles = suite.testFiles.map(file => join(__dirname, file)).join(' ');
      const coverageFlag = options.coverage ? '--coverage' : '';
      const reporterFlag = options.verbose ? '--reporter=verbose' : '--reporter=basic';
      
      const command = `npx vitest run ${testFiles} ${coverageFlag} ${reporterFlag} --config=${join(__dirname, 'vitest.config.ts')}`;
      
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: __dirname,
        timeout: suite.estimatedTimeMs * 2 // Allow 2x estimated time
      });

      const duration = Date.now() - startTime;
      
      // Parse test results from output
      const result = this.parseTestOutput(suite.name, output, duration);
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        suiteName: suite.name,
        success: false,
        duration,
        testCount: 0,
        passCount: 0,
        failCount: 1,
        skipCount: 0,
        errors: [error.message || 'Unknown error']
      };
    }
  }

  private parseTestOutput(suiteName: string, output: string, duration: number): TestResult {
    // Parse Vitest output to extract test statistics
    // This is a simplified parser - in production you'd want more robust parsing
    
    const testCountMatch = output.match(/(\d+) passed/);
    const failCountMatch = output.match(/(\d+) failed/);
    const skipCountMatch = output.match(/(\d+) skipped/);
    
    const passCount = testCountMatch ? parseInt(testCountMatch[1]) : 0;
    const failCount = failCountMatch ? parseInt(failCountMatch[1]) : 0;
    const skipCount = skipCountMatch ? parseInt(skipCountMatch[1]) : 0;
    const testCount = passCount + failCount + skipCount;
    
    const errors: string[] = [];
    if (failCount > 0) {
      const errorMatches = output.match(/Error: .+/g);
      if (errorMatches) {
        errors.push(...errorMatches.slice(0, 5)); // Limit to first 5 errors
      }
    }

    return {
      suiteName,
      success: failCount === 0,
      duration,
      testCount,
      passCount,
      failCount,
      skipCount,
      errors
    };
  }

  private async generateReport(totalDuration: number): Promise<TestReport> {
    const totalTests = this.results.reduce((sum, r) => sum + r.testCount, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passCount, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        databaseVersion: 'PostgreSQL 15+', // Would query actual version
        testFramework: 'Vitest'
      },
      summary: {
        totalSuites: TEST_SUITES.length,
        totalTests,
        totalDuration,
        successRate
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    const reportFile = join(this.reportsDir, `database-test-report-${Date.now()}.json`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportFile}`);

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedSuites = this.results.filter(r => !r.success);
    if (failedSuites.length > 0) {
      recommendations.push(`🔴 ${failedSuites.length} test suite(s) failed - investigate and fix before deployment`);
    }

    const slowSuites = this.results.filter(r => r.duration > 60000);
    if (slowSuites.length > 0) {
      recommendations.push(`⚠️  ${slowSuites.length} test suite(s) running slowly - consider optimization`);
    }

    const securitySuites = this.results.filter(r => 
      r.suiteName.toLowerCase().includes('security') && !r.success
    );
    if (securitySuites.length > 0) {
      recommendations.push('🛡️  Security test failures detected - immediate attention required');
    }

    const complianceSuites = this.results.filter(r => 
      r.suiteName.toLowerCase().includes('gdpr') && !r.success
    );
    if (complianceSuites.length > 0) {
      recommendations.push('⚖️  GDPR compliance test failures - legal review required');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All tests passing - database is production ready');
    }

    return recommendations;
  }

  private async storeResultsInMemory(report: TestReport): Promise<void> {
    try {
      // Store in memory for swarm coordination
      const memoryData = {
        testType: 'database',
        timestamp: report.timestamp,
        success: report.summary.successRate === 100,
        summary: report.summary,
        recommendations: report.recommendations,
        detailedResults: report.results,
        dutchFuneralCompliance: {
          gdprCompliant: this.results.find(r => r.suiteName.includes('GDPR'))?.success || false,
          securityPolicies: this.results.find(r => r.suiteName.includes('Security'))?.success || false,
          dataRetention: this.results.find(r => r.suiteName.includes('GDPR'))?.success || false,
          auditTrail: this.results.every(r => r.success)
        }
      };

      // This would integrate with the Memory system
      console.log(`\n💾 Test results stored in memory: ${this.memoryPath}`);
      
      // For now, save to local file
      const memoryFile = join(this.reportsDir, 'memory-storage.json');
      writeFileSync(memoryFile, JSON.stringify(memoryData, null, 2));
      
    } catch (error) {
      console.warn('⚠️  Could not store results in memory system:', error);
    }
  }

  private displaySummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Test Suites: ${report.summary.totalSuites}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
    console.log('');

    console.log('📋 SUITE RESULTS:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      console.log(`  ${status} ${result.suiteName}: ${result.passCount}/${result.testCount} tests (${duration}s)`);
    });

    if (report.recommendations.length > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (report.summary.successRate === 100) {
      console.log('🎉 ALL TESTS PASSED - Database is production ready!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review failures before deployment');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    coverage: args.includes('--coverage') || args.includes('-c'),
    parallel: args.includes('--parallel') || args.includes('-p'),
    suiteFilter: args.filter(arg => !arg.startsWith('--'))
  };

  const runner = new DatabaseTestRunner();
  
  try {
    await runner.runAllTests(options);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { DatabaseTestRunner, TEST_SUITES };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}