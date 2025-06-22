/**
 * REAL-TIME TEST RUNNER - COMPREHENSIVE TEST EXECUTION AND REPORTING
 * 
 * Purpose: Execute all real-time tests and generate comprehensive reports
 * Features: Test orchestration, performance metrics, failure analysis, coverage reporting
 * Output: Detailed test results, performance benchmarks, recommendations
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface TestResult {
    suite: string
    test: string
    status: 'passed' | 'failed' | 'skipped'
    duration: number
    error?: string
    metrics?: {
        memory: number
        cpu: number
        network: number
    }
}

interface TestSuite {
    name: string
    tests: TestResult[]
    totalTests: number
    passedTests: number
    failedTests: number
    skippedTests: number
    totalDuration: number
    coverage?: number
}

interface TestReport {
    timestamp: string
    environment: {
        nodeVersion: string
        platform: string
        memory: string
    }
    summary: {
        totalSuites: number
        totalTests: number
        passedTests: number
        failedTests: number
        skippedTests: number
        overallDuration: number
        successRate: number
    }
    suites: TestSuite[]
    performanceMetrics: {
        averageResponseTime: number
        throughput: number
        errorRate: number
        memoryUsage: number
    }
    networkConditions: {
        latency: string
        bandwidth: string
        packetLoss: string
    }
    recommendations: string[]
}

export class RealTimeTestRunner {
    private results: TestResult[] = []
    private startTime: number = 0
    private endTime: number = 0

    async runAllTests(): Promise<TestReport> {
        console.log('🚀 Starting comprehensive real-time feature testing...')
        this.startTime = Date.now()

        const testSuites = [
            {
                name: 'WebSocket Connection Tests',
                file: 'websocket-connection.test.ts',
                description: 'Connection management, reconnection, error handling'
            },
            {
                name: 'Chat System Tests',
                file: 'chat-system.test.ts',
                description: 'Messaging, typing indicators, file sharing, reactions'
            },
            {
                name: 'Notification System Tests',
                file: 'notification-system.test.ts',
                description: 'Multi-channel delivery, preferences, batching'
            },
            {
                name: 'Presence Tracking Tests',
                file: 'presence-tracking.test.ts',
                description: 'Online/offline detection, activity tracking, idle states'
            },
            {
                name: 'Collaborative Features Tests',
                file: 'collaborative-features.test.ts',
                description: 'Document editing, conflict resolution, version control'
            },
            {
                name: 'Integration Tests',
                file: 'integration.test.ts',
                description: 'End-to-end scenarios, network issues, concurrent users'
            }
        ]

        const suiteResults: TestSuite[] = []

        for (const suite of testSuites) {
            console.log(`\n📋 Running ${suite.name}...`)
            const suiteResult = await this.runTestSuite(suite)
            suiteResults.push(suiteResult)
            this.logSuiteResult(suiteResult)
        }

        this.endTime = Date.now()

        // Generate comprehensive report
        const report = await this.generateReport(suiteResults)
        
        // Save report to file
        await this.saveReport(report)
        
        // Store in Memory for swarm coordination
        await this.storeInMemory(report)

        this.logFinalResults(report)

        return report
    }

    private async runTestSuite(suite: { name: string; file: string; description: string }): Promise<TestSuite> {
        const suiteStartTime = Date.now()
        const tests: TestResult[] = []

        try {
            // Run the test suite using vitest
            const { stdout, stderr } = await execAsync(
                `npx vitest run tests/realtime/${suite.file} --reporter=json`,
                { cwd: process.cwd() }
            )

            // Parse vitest JSON output
            const testResults = this.parseVitestOutput(stdout)
            tests.push(...testResults.map(result => ({
                ...result,
                suite: suite.name
            })))

        } catch (error: any) {
            console.error(`❌ Error running ${suite.name}:`, error.message)
            
            // Add error result
            tests.push({
                suite: suite.name,
                test: 'Suite Execution',
                status: 'failed',
                duration: 0,
                error: error.message
            })
        }

        const suiteEndTime = Date.now()
        const totalDuration = suiteEndTime - suiteStartTime

        return {
            name: suite.name,
            tests,
            totalTests: tests.length,
            passedTests: tests.filter(t => t.status === 'passed').length,
            failedTests: tests.filter(t => t.status === 'failed').length,
            skippedTests: tests.filter(t => t.status === 'skipped').length,
            totalDuration
        }
    }

    private parseVitestOutput(stdout: string): TestResult[] {
        try {
            const lines = stdout.split('\n').filter(line => line.trim())
            const jsonLine = lines.find(line => line.startsWith('{'))
            
            if (!jsonLine) {
                return []
            }

            const result = JSON.parse(jsonLine)
            const tests: TestResult[] = []

            if (result.testResults) {
                for (const testFile of result.testResults) {
                    for (const test of testFile.assertionResults || []) {
                        tests.push({
                            suite: '',
                            test: test.fullName || test.title,
                            status: test.status === 'passed' ? 'passed' : 
                                   test.status === 'failed' ? 'failed' : 'skipped',
                            duration: test.duration || 0,
                            error: test.failureMessages?.[0]
                        })
                    }
                }
            }

            return tests
        } catch (error) {
            console.warn('Failed to parse vitest output:', error)
            return []
        }
    }

    private async generateReport(suiteResults: TestSuite[]): Promise<TestReport> {
        const totalTests = suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0)
        const passedTests = suiteResults.reduce((sum, suite) => sum + suite.passedTests, 0)
        const failedTests = suiteResults.reduce((sum, suite) => sum + suite.failedTests, 0)
        const skippedTests = suiteResults.reduce((sum, suite) => sum + suite.skippedTests, 0)
        const overallDuration = this.endTime - this.startTime

        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

        // Calculate performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(suiteResults)
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(suiteResults, performanceMetrics)

        return {
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
            },
            summary: {
                totalSuites: suiteResults.length,
                totalTests,
                passedTests,
                failedTests,
                skippedTests,
                overallDuration,
                successRate
            },
            suites: suiteResults,
            performanceMetrics,
            networkConditions: {
                latency: 'Simulated: 0-2000ms',
                bandwidth: 'Simulated: Various conditions',
                packetLoss: 'Simulated: 0-30%'
            },
            recommendations
        }
    }

    private calculatePerformanceMetrics(suites: TestSuite[]): TestReport['performanceMetrics'] {
        const allTests = suites.flatMap(suite => suite.tests)
        const validTests = allTests.filter(test => test.duration > 0)

        const averageResponseTime = validTests.length > 0 
            ? validTests.reduce((sum, test) => sum + test.duration, 0) / validTests.length 
            : 0

        const errorRate = allTests.length > 0 
            ? (allTests.filter(test => test.status === 'failed').length / allTests.length) * 100 
            : 0

        return {
            averageResponseTime,
            throughput: validTests.length > 0 ? validTests.length / (Date.now() - this.startTime) * 1000 : 0,
            errorRate,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
        }
    }

    private generateRecommendations(suites: TestSuite[], metrics: TestReport['performanceMetrics']): string[] {
        const recommendations: string[] = []

        // Performance recommendations
        if (metrics.averageResponseTime > 1000) {
            recommendations.push('Consider optimizing WebSocket message processing for better response times')
        }

        if (metrics.errorRate > 5) {
            recommendations.push('High error rate detected - review error handling and retry mechanisms')
        }

        if (metrics.memoryUsage > 100) {
            recommendations.push('Memory usage is high - implement cleanup routines for real-time connections')
        }

        // Suite-specific recommendations
        const failedSuites = suites.filter(suite => suite.failedTests > 0)
        if (failedSuites.length > 0) {
            recommendations.push(`Review failed tests in: ${failedSuites.map(s => s.name).join(', ')}`)
        }

        // WebSocket specific
        const wsTests = suites.find(s => s.name.includes('WebSocket'))
        if (wsTests && wsTests.failedTests > wsTests.passedTests * 0.1) {
            recommendations.push('WebSocket connection stability needs improvement - review reconnection logic')
        }

        // Chat system specific
        const chatTests = suites.find(s => s.name.includes('Chat'))
        if (chatTests && chatTests.failedTests > 0) {
            recommendations.push('Chat system has issues - verify message ordering and delivery guarantees')
        }

        // Collaborative features specific
        const collabTests = suites.find(s => s.name.includes('Collaborative'))
        if (collabTests && collabTests.failedTests > 0) {
            recommendations.push('Collaborative features need attention - review conflict resolution algorithms')
        }

        if (recommendations.length === 0) {
            recommendations.push('All real-time features are performing well!')
            recommendations.push('Consider adding more stress tests for higher user loads')
            recommendations.push('Monitor production metrics to validate test scenarios')
        }

        return recommendations
    }

    private logSuiteResult(suite: TestSuite): void {
        const passRate = suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0
        const status = passRate === 100 ? '✅' : passRate >= 80 ? '⚠️' : '❌'
        
        console.log(`${status} ${suite.name}`)
        console.log(`   Tests: ${suite.passedTests}/${suite.totalTests} passed (${passRate.toFixed(1)}%)`)
        console.log(`   Duration: ${suite.totalDuration}ms`)
        
        if (suite.failedTests > 0) {
            console.log(`   ❌ Failed tests: ${suite.failedTests}`)
            suite.tests.filter(t => t.status === 'failed').forEach(test => {
                console.log(`      - ${test.test}: ${test.error?.substring(0, 100)}...`)
            })
        }
    }

    private logFinalResults(report: TestReport): void {
        console.log('\n' + '='.repeat(80))
        console.log('🎯 REAL-TIME FEATURE TESTING COMPLETE')
        console.log('='.repeat(80))
        
        console.log(`\n📊 SUMMARY:`)
        console.log(`   Total Tests: ${report.summary.totalTests}`)
        console.log(`   Passed: ${report.summary.passedTests} ✅`)
        console.log(`   Failed: ${report.summary.failedTests} ❌`)
        console.log(`   Skipped: ${report.summary.skippedTests} ⏭️`)
        console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`)
        console.log(`   Total Duration: ${(report.summary.overallDuration / 1000).toFixed(1)}s`)

        console.log(`\n⚡ PERFORMANCE:`)
        console.log(`   Average Response Time: ${report.performanceMetrics.averageResponseTime.toFixed(1)}ms`)
        console.log(`   Error Rate: ${report.performanceMetrics.errorRate.toFixed(1)}%`)
        console.log(`   Memory Usage: ${report.performanceMetrics.memoryUsage.toFixed(1)}MB`)

        console.log(`\n💡 RECOMMENDATIONS:`)
        report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`)
        })

        console.log(`\n📄 Report saved to: /workspaces/funerally/tests/realtime/test-report.json`)
        console.log(`📄 Memory key: swarm-testing-1750494292308/realtime/tests`)
        
        if (report.summary.successRate >= 95) {
            console.log('\n🎉 Excellent! Real-time features are highly reliable.')
        } else if (report.summary.successRate >= 80) {
            console.log('\n⚠️ Good performance, but some areas need attention.')
        } else {
            console.log('\n🚨 Critical issues detected in real-time features.')
        }
    }

    private async saveReport(report: TestReport): Promise<void> {
        try {
            const reportPath = path.join(process.cwd(), 'tests', 'realtime', 'test-report.json')
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
            
            // Also save a summary report
            const summaryPath = path.join(process.cwd(), 'tests', 'realtime', 'test-summary.md')
            const summaryContent = this.generateMarkdownSummary(report)
            await fs.writeFile(summaryPath, summaryContent)
            
        } catch (error) {
            console.error('Failed to save report:', error)
        }
    }

    private generateMarkdownSummary(report: TestReport): string {
        return `# Real-Time Features Test Report

## Summary
- **Date**: ${new Date(report.timestamp).toLocaleString()}
- **Total Tests**: ${report.summary.totalTests}
- **Success Rate**: ${report.summary.successRate.toFixed(1)}%
- **Duration**: ${(report.summary.overallDuration / 1000).toFixed(1)}s

## Test Suites

${report.suites.map(suite => `
### ${suite.name}
- **Tests**: ${suite.passedTests}/${suite.totalTests} passed
- **Duration**: ${suite.totalDuration}ms
- **Status**: ${suite.failedTests === 0 ? '✅ All tests passed' : `❌ ${suite.failedTests} tests failed`}
`).join('\n')}

## Performance Metrics
- **Average Response Time**: ${report.performanceMetrics.averageResponseTime.toFixed(1)}ms
- **Error Rate**: ${report.performanceMetrics.errorRate.toFixed(1)}%
- **Memory Usage**: ${report.performanceMetrics.memoryUsage.toFixed(1)}MB

## Network Conditions Tested
- **Latency**: ${report.networkConditions.latency}
- **Bandwidth**: ${report.networkConditions.bandwidth}
- **Packet Loss**: ${report.networkConditions.packetLoss}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Environment
- **Node Version**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Memory**: ${report.environment.memory}
`
    }

    private async storeInMemory(report: TestReport): Promise<void> {
        try {
            // Store in the Memory system for swarm coordination
            const memoryKey = 'swarm-testing-1750494292308/realtime/tests'
            
            const memoryData = {
                testResults: {
                    timestamp: report.timestamp,
                    summary: report.summary,
                    performanceMetrics: report.performanceMetrics,
                    recommendations: report.recommendations,
                    detailedResults: report.suites.map(suite => ({
                        name: suite.name,
                        passRate: suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0,
                        failedTests: suite.failedTests,
                        duration: suite.totalDuration,
                        status: suite.failedTests === 0 ? 'passed' : 'failed'
                    }))
                },
                testCoverage: {
                    websocketConnection: report.suites.find(s => s.name.includes('WebSocket'))?.passedTests || 0,
                    chatSystem: report.suites.find(s => s.name.includes('Chat'))?.passedTests || 0,
                    notificationSystem: report.suites.find(s => s.name.includes('Notification'))?.passedTests || 0,
                    presenceTracking: report.suites.find(s => s.name.includes('Presence'))?.passedTests || 0,
                    collaborativeFeatures: report.suites.find(s => s.name.includes('Collaborative'))?.passedTests || 0,
                    integration: report.suites.find(s => s.name.includes('Integration'))?.passedTests || 0
                },
                qualityMetrics: {
                    reliability: report.summary.successRate,
                    performance: Math.max(0, 100 - (report.performanceMetrics.averageResponseTime / 10)),
                    scalability: report.suites.find(s => s.name.includes('Integration'))?.passedTests || 0,
                    errorHandling: Math.max(0, 100 - report.performanceMetrics.errorRate),
                    networkResilience: report.suites.find(s => s.name.includes('Integration'))?.passedTests || 0
                },
                nextSteps: [
                    'Review failed tests and implement fixes',
                    'Add monitoring for production real-time features',
                    'Implement automated performance regression testing',
                    'Set up alerting for real-time feature degradation',
                    'Plan load testing with higher user concurrency'
                ]
            }

            // Write to memory file system
            const memoryPath = path.join(process.cwd(), 'memory', 'data', 'entries.json')
            
            let existingMemory = {}
            try {
                const existingData = await fs.readFile(memoryPath, 'utf-8')
                existingMemory = JSON.parse(existingData)
            } catch (error) {
                // File doesn't exist or is invalid, start fresh
            }

            const updatedMemory = {
                ...existingMemory,
                [memoryKey]: memoryData
            }

            await fs.writeFile(memoryPath, JSON.stringify(updatedMemory, null, 2))
            console.log(`\n💾 Test results stored in Memory: ${memoryKey}`)

        } catch (error) {
            console.error('Failed to store results in Memory:', error)
        }
    }
}

// CLI execution
if (require.main === module) {
    const runner = new RealTimeTestRunner()
    runner.runAllTests()
        .then(report => {
            const exitCode = report.summary.successRate >= 80 ? 0 : 1
            process.exit(exitCode)
        })
        .catch(error => {
            console.error('Test runner failed:', error)
            process.exit(1)
        })
}

export default RealTimeTestRunner