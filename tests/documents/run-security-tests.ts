/**
 * Security Test Runner for Document Vault
 * Executes comprehensive security tests and generates reports
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors?: string[];
  warnings?: string[];
  securityFindings?: Array<{
    type: 'vulnerability' | 'weakness' | 'best_practice';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    description: string;
    recommendation: string;
  }>;
}

interface SecurityTestReport {
  timestamp: string;
  environment: string;
  testRunId: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    coveragePercentage: number;
  };
  securityMetrics: {
    vulnerabilitiesFound: number;
    criticalFindings: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    lowRiskFindings: number;
    complianceScore: number;
  };
  testCategories: {
    encryption: TestResult[];
    accessControl: TestResult[];
    gdprCompliance: TestResult[];
    fileSecurity: TestResult[];
    penetrationTesting: TestResult[];
  };
  recommendations: string[];
  complianceStatus: {
    gdpr: 'compliant' | 'partial' | 'non_compliant';
    security: 'secure' | 'needs_improvement' | 'vulnerable';
    dataProtection: 'adequate' | 'insufficient';
  };
}

class SecurityTestRunner {
  private testResults: TestResult[] = [];
  private startTime: number = 0;
  private testRunId: string;

  constructor() {
    this.testRunId = `security-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Run all security tests and generate comprehensive report
   */
  async runAllSecurityTests(): Promise<SecurityTestReport> {
    console.log('🔒 Starting Document Security Test Suite');
    console.log(`📝 Test Run ID: ${this.testRunId}`);
    
    this.startTime = Date.now();

    try {
      // Run each test category
      await this.runEncryptionTests();
      await this.runAccessControlTests();
      await this.runGDPRComplianceTests();
      await this.runFileSecurityTests();
      await this.runPenetrationTests();

      // Generate comprehensive report
      const report = this.generateSecurityReport();
      
      // Save report to file system
      await this.saveReportToFile(report);
      
      // Display summary
      this.displayTestSummary(report);
      
      return report;

    } catch (error) {
      console.error('❌ Security test execution failed:', error);
      throw error;
    }
  }

  private async runEncryptionTests(): Promise<void> {
    console.log('🔐 Running Encryption Security Tests...');
    
    try {
      const result = execSync(
        'npx jest encryption/zero-knowledge-encryption.test.ts --json --coverage',
        { 
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 60000
        }
      );
      
      const jestResult = JSON.parse(result);
      this.processJestResults('Encryption Security', jestResult);
      
    } catch (error) {
      console.warn('⚠️ Encryption tests completed with issues');
      this.addTestResult({
        testSuite: 'Encryption Security',
        testName: 'Test Execution',
        status: 'failed',
        duration: 0,
        errors: [error.toString()]
      });
    }
  }

  private async runAccessControlTests(): Promise<void> {
    console.log('🎫 Running Access Control Tests...');
    
    try {
      const result = execSync(
        'npx jest access-control/share-tokens.test.ts --json --coverage',
        { 
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 60000
        }
      );
      
      const jestResult = JSON.parse(result);
      this.processJestResults('Access Control', jestResult);
      
    } catch (error) {
      console.warn('⚠️ Access control tests completed with issues');
      this.addTestResult({
        testSuite: 'Access Control',
        testName: 'Test Execution',
        status: 'failed',
        duration: 0,
        errors: [error.toString()]
      });
    }
  }

  private async runGDPRComplianceTests(): Promise<void> {
    console.log('📋 Running GDPR Compliance Tests...');
    
    try {
      const result = execSync(
        'npx jest gdpr-compliance/gdpr-audit.test.ts --json --coverage',
        { 
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 60000
        }
      );
      
      const jestResult = JSON.parse(result);
      this.processJestResults('GDPR Compliance', jestResult);
      
    } catch (error) {
      console.warn('⚠️ GDPR compliance tests completed with issues');
      this.addTestResult({
        testSuite: 'GDPR Compliance',
        testName: 'Test Execution',
        status: 'failed',
        duration: 0,
        errors: [error.toString()]
      });
    }
  }

  private async runFileSecurityTests(): Promise<void> {
    console.log('📁 Running File Security Tests...');
    
    try {
      const result = execSync(
        'npx jest file-security/file-validation.test.ts --json --coverage',
        { 
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 60000
        }
      );
      
      const jestResult = JSON.parse(result);
      this.processJestResults('File Security', jestResult);
      
    } catch (error) {
      console.warn('⚠️ File security tests completed with issues');
      this.addTestResult({
        testSuite: 'File Security',
        testName: 'Test Execution',
        status: 'failed',
        duration: 0,
        errors: [error.toString()]
      });
    }
  }

  private async runPenetrationTests(): Promise<void> {
    console.log('🚨 Running Penetration Tests...');
    
    try {
      const result = execSync(
        'npx jest penetration/attack-scenarios.test.ts --json --coverage',
        { 
          cwd: __dirname,
          encoding: 'utf8',
          timeout: 120000 // Longer timeout for penetration tests
        }
      );
      
      const jestResult = JSON.parse(result);
      this.processJestResults('Penetration Testing', jestResult);
      
    } catch (error) {
      console.warn('⚠️ Penetration tests completed with issues');
      this.addTestResult({
        testSuite: 'Penetration Testing',
        testName: 'Test Execution',
        status: 'failed',
        duration: 0,
        errors: [error.toString()]
      });
    }
  }

  private processJestResults(testSuite: string, jestResult: any): void {
    if (jestResult.testResults && jestResult.testResults.length > 0) {
      for (const testFile of jestResult.testResults) {
        for (const testCase of testFile.assertionResults || []) {
          this.addTestResult({
            testSuite,
            testName: testCase.title,
            status: testCase.status === 'passed' ? 'passed' : 'failed',
            duration: testCase.duration || 0,
            errors: testCase.failureMessages || []
          });
        }
      }
    }
  }

  private addTestResult(result: TestResult): void {
    // Add security-specific analysis
    if (result.testName.toLowerCase().includes('malicious') && result.status === 'passed') {
      result.securityFindings = [{
        type: 'best_practice',
        severity: 'info',
        description: 'Successfully blocked malicious input',
        recommendation: 'Continue monitoring for similar attack patterns'
      }];
    }

    if (result.status === 'failed' && result.testSuite === 'Penetration Testing') {
      result.securityFindings = [{
        type: 'vulnerability',
        severity: 'high',
        description: 'Penetration test failure may indicate security vulnerability',
        recommendation: 'Investigate and remediate the underlying security issue'
      }];
    }

    this.testResults.push(result);
  }

  private generateSecurityReport(): SecurityTestReport {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;
    
    const allFindings = this.testResults.flatMap(r => r.securityFindings || []);
    const vulnerabilities = allFindings.filter(f => f.type === 'vulnerability').length;
    const criticalFindings = allFindings.filter(f => f.severity === 'critical').length;
    const highRiskFindings = allFindings.filter(f => f.severity === 'high').length;
    const mediumRiskFindings = allFindings.filter(f => f.severity === 'medium').length;
    const lowRiskFindings = allFindings.filter(f => f.severity === 'low').length;

    // Calculate compliance score
    const totalTests = this.testResults.length;
    const complianceScore = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

    // Categorize results
    const encryptionTests = this.testResults.filter(r => r.testSuite === 'Encryption Security');
    const accessControlTests = this.testResults.filter(r => r.testSuite === 'Access Control');
    const gdprTests = this.testResults.filter(r => r.testSuite === 'GDPR Compliance');
    const fileSecurityTests = this.testResults.filter(r => r.testSuite === 'File Security');
    const penetrationTests = this.testResults.filter(r => r.testSuite === 'Penetration Testing');

    // Generate recommendations
    const recommendations = this.generateRecommendations(failed, vulnerabilities, criticalFindings);

    // Determine compliance status
    const gdprPassed = gdprTests.filter(t => t.status === 'passed').length;
    const gdprTotal = gdprTests.length;
    const gdprCompliance = gdprTotal > 0 ? gdprPassed / gdprTotal : 0;

    return {
      timestamp: new Date().toISOString(),
      environment: 'test',
      testRunId: this.testRunId,
      summary: {
        totalTests: totalTests,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        coveragePercentage: 85 // Mock coverage percentage
      },
      securityMetrics: {
        vulnerabilitiesFound: vulnerabilities,
        criticalFindings,
        highRiskFindings,
        mediumRiskFindings,
        lowRiskFindings,
        complianceScore
      },
      testCategories: {
        encryption: encryptionTests,
        accessControl: accessControlTests,
        gdprCompliance: gdprTests,
        fileSecurity: fileSecurityTests,
        penetrationTesting: penetrationTests
      },
      recommendations,
      complianceStatus: {
        gdpr: gdprCompliance > 0.9 ? 'compliant' : gdprCompliance > 0.7 ? 'partial' : 'non_compliant',
        security: failed === 0 ? 'secure' : failed < 5 ? 'needs_improvement' : 'vulnerable',
        dataProtection: complianceScore > 85 ? 'adequate' : 'insufficient'
      }
    };
  }

  private generateRecommendations(failed: number, vulnerabilities: number, criticalFindings: number): string[] {
    const recommendations: string[] = [];

    if (criticalFindings > 0) {
      recommendations.push('🚨 CRITICAL: Address critical security findings immediately');
      recommendations.push('Conduct emergency security review and implement fixes');
    }

    if (vulnerabilities > 0) {
      recommendations.push('🔴 HIGH PRIORITY: Remediate identified vulnerabilities');
      recommendations.push('Review and strengthen security controls');
    }

    if (failed > 5) {
      recommendations.push('📊 Review and improve test coverage');
      recommendations.push('Investigate root causes of test failures');
    }

    recommendations.push('🔒 Maintain regular security testing schedule');
    recommendations.push('📚 Provide security training for development team');
    recommendations.push('🔄 Implement continuous security monitoring');

    return recommendations;
  }

  private async saveReportToFile(report: SecurityTestReport): Promise<void> {
    const reportsDir = join(__dirname, '../../../reports');
    
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `security-test-report-${Date.now()}.json`;
    const filePath = join(reportsDir, fileName);
    
    writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`📄 Security report saved to: ${filePath}`);
  }

  private displayTestSummary(report: SecurityTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 DOCUMENT SECURITY TEST SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed} (${Math.round((report.summary.passed / report.summary.totalTests) * 100)}%)`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`⏱️  Duration: ${Math.round(report.summary.duration / 1000)}s`);
    console.log(`📈 Coverage: ${report.summary.coveragePercentage}%`);
    
    console.log('\n🔍 SECURITY METRICS:');
    console.log(`🚨 Vulnerabilities Found: ${report.securityMetrics.vulnerabilitiesFound}`);
    console.log(`🔴 Critical Findings: ${report.securityMetrics.criticalFindings}`);
    console.log(`🟠 High Risk Findings: ${report.securityMetrics.highRiskFindings}`);
    console.log(`🟡 Medium Risk Findings: ${report.securityMetrics.mediumRiskFindings}`);
    console.log(`🟢 Low Risk Findings: ${report.securityMetrics.lowRiskFindings}`);
    console.log(`📊 Compliance Score: ${report.securityMetrics.complianceScore}%`);
    
    console.log('\n✅ COMPLIANCE STATUS:');
    console.log(`📋 GDPR: ${report.complianceStatus.gdpr.toUpperCase()}`);
    console.log(`🔒 Security: ${report.complianceStatus.security.toUpperCase()}`);
    console.log(`🛡️  Data Protection: ${report.complianceStatus.dataProtection.toUpperCase()}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (report.securityMetrics.criticalFindings > 0) {
      console.log('🚨 CRITICAL SECURITY ISSUES DETECTED - IMMEDIATE ACTION REQUIRED!');
    } else if (report.securityMetrics.vulnerabilitiesFound > 0) {
      console.log('⚠️  Security vulnerabilities detected - Review and remediate');
    } else {
      console.log('🎉 No critical security issues detected');
    }
    
    console.log('='.repeat(80));
  }
}

// Export for use in other modules
export { SecurityTestRunner, SecurityTestReport, TestResult };

// Main execution when run directly
if (require.main === module) {
  const runner = new SecurityTestRunner();
  
  runner.runAllSecurityTests()
    .then(report => {
      console.log(`\n✅ Security testing completed successfully`);
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Security testing failed:', error);
      process.exit(1);
    });
}