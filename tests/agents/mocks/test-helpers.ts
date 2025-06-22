/**
 * Test Helper Functions and Mock Utilities
 * 
 * Shared utilities and helpers for agent testing across all test suites.
 */

import { jest } from '@jest/globals';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

/**
 * Mock Message Factory
 */
export class MockMessageFactory {
  static createHumanMessage(content: string, metadata?: any): HumanMessage {
    return new HumanMessage({
      content,
      additional_kwargs: metadata || {}
    });
  }

  static createAIMessage(content: string, metadata?: any): AIMessage {
    return new AIMessage({
      content,
      additional_kwargs: metadata || {}
    });
  }

  static createMessageSequence(messages: string[], type: 'human' | 'ai' = 'human'): BaseMessage[] {
    return messages.map(content => 
      type === 'human' 
        ? this.createHumanMessage(content)
        : this.createAIMessage(content)
    );
  }
}

/**
 * Mock Family Data Generator
 */
export class MockFamilyDataGenerator {
  static generateChristianFamily(overrides: any = {}) {
    return {
      familyId: `christian_family_${Date.now()}`,
      primaryContact: 'John Smith',
      contactPhone: '+31-6-12345678',
      contactEmail: 'john.smith@example.com',
      primaryCulture: 'Dutch',
      primaryReligion: 'christian',
      denomination: 'Protestant',
      preferredLanguage: 'Dutch',
      serviceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      expectedGuests: 100,
      budget: 5000,
      specialRequests: [],
      ...overrides
    };
  }

  static generateIslamicFamily(overrides: any = {}) {
    return {
      familyId: `islamic_family_${Date.now()}`,
      primaryContact: 'Ahmed Hassan',
      contactPhone: '+31-6-87654321',
      contactEmail: 'ahmed.hassan@example.com',
      primaryCulture: 'Middle Eastern',
      primaryReligion: 'islamic',
      denomination: 'Sunni',
      preferredLanguage: 'Arabic',
      serviceDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Urgent - within 24 hours
      expectedGuests: 75,
      budget: 3000,
      requiresImam: true,
      qiblaDirection: true,
      specialRequests: ['Prayer room', 'Halal catering'],
      ...overrides
    };
  }

  static generateJewishFamily(overrides: any = {}) {
    return {
      familyId: `jewish_family_${Date.now()}`,
      primaryContact: 'Sarah Cohen',
      contactPhone: '+31-6-11223344',
      contactEmail: 'sarah.cohen@example.com',
      primaryCulture: 'Jewish',
      primaryReligion: 'jewish',
      denomination: 'Orthodox',
      preferredLanguage: 'English',
      serviceDate: new Date(Date.now() + 36 * 60 * 60 * 1000), // Within 36 hours
      expectedGuests: 150,
      budget: 7500,
      requiresRabbi: true,
      kosherRequirements: true,
      specialRequests: ['Kosher meal', 'Shiva arrangements'],
      ...overrides
    };
  }

  static generateHinduFamily(overrides: any = {}) {
    return {
      familyId: `hindu_family_${Date.now()}`,
      primaryContact: 'Priya Sharma',
      contactPhone: '+31-6-55667788',
      contactEmail: 'priya.sharma@example.com',
      primaryCulture: 'Indian',
      primaryReligion: 'hindu',
      preferredLanguage: 'Hindi',
      serviceDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // Within 12 hours
      expectedGuests: 200,
      budget: 4000,
      requiresPandit: true,
      prefersCremation: true,
      specialRequests: ['Vegetarian meals', 'Sacred fire ceremony'],
      ...overrides
    };
  }

  static generateDutchFamily(overrides: any = {}) {
    return {
      familyId: `dutch_family_${Date.now()}`,
      primaryContact: 'Pieter van der Berg',
      contactPhone: '+31-6-99887766',
      contactEmail: 'pieter.vandenberg@example.com',
      primaryCulture: 'Dutch',
      primaryReligion: 'christian',
      denomination: 'Dutch Reformed',
      preferredLanguage: 'Dutch',
      serviceDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      expectedGuests: 120,
      budget: 6000,
      preferSimpleService: true,
      specialRequests: ['Traditional hymns', 'Coffee service'],
      ...overrides
    };
  }

  static generateInterfaithFamily(overrides: any = {}) {
    return {
      familyId: `interfaith_family_${Date.now()}`,
      primaryContact: 'Maria Cohen-Smith',
      contactPhone: '+31-6-44332211',
      contactEmail: 'maria.cohensmith@example.com',
      primaryCulture: 'Mixed',
      primaryReligion: 'christian',
      secondaryCultures: ['Jewish'],
      secondaryReligions: ['jewish'],
      denomination: 'Interfaith',
      preferredLanguage: 'English',
      serviceDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      expectedGuests: 180,
      budget: 8500,
      requiresInterfaithClergy: true,
      specialRequests: ['Ecumenical elements', 'Kosher options', 'Multiple traditions'],
      ...overrides
    };
  }
}

/**
 * Mock Configuration Generator
 */
export class MockConfigGenerator {
  static generateBasicConfig(threadId?: string) {
    return {
      configurable: {
        thread_id: threadId || `test_thread_${Date.now()}`,
        checkpoint_ns: 'test_namespace',
      },
    };
  }

  static generateCheckpointConfig(options: any = {}) {
    return {
      configurable: {
        thread_id: options.threadId || `checkpoint_test_${Date.now()}`,
        checkpoint_ns: options.namespace || 'checkpoint_test',
        checkpoint_id: options.checkpointId,
      },
    };
  }

  static generateCulturalConfig(culture: string, religion: string) {
    return {
      configurable: {
        thread_id: `cultural_${culture}_${religion}_${Date.now()}`,
        checkpoint_ns: 'cultural_test',
      },
    };
  }
}

/**
 * Mock State Generator
 */
export class MockStateGenerator {
  static generateInitialWorkflowState(familyData: any = {}) {
    return {
      messages: [],
      planningStage: 'initial',
      familyRequirements: familyData,
      culturalRequirements: {},
      documentsRequired: [],
      documentsCollected: [],
      venueRequirements: {},
      serviceDetails: {},
      approvals: [],
      pendingDecisions: [],
      errors: [],
      currentAgent: 'orchestrator',
      timestamp: new Date(),
    };
  }

  static generateDocumentCollectionState(familyId: string, documents: string[] = []) {
    return {
      messages: [],
      planningStage: 'document_collection',
      familyRequirements: { familyId },
      culturalRequirements: {},
      documentsRequired: ['death_certificate', 'burial_permit', 'identity_proof'],
      documentsCollected: documents,
      venueRequirements: {},
      serviceDetails: {},
      approvals: [],
      pendingDecisions: [],
      errors: [],
      currentAgent: 'document_collector',
      timestamp: new Date(),
    };
  }

  static generateApprovalState(familyId: string, pendingDecisions: any[] = []) {
    return {
      messages: [],
      planningStage: 'approval_process',
      familyRequirements: { familyId },
      culturalRequirements: {},
      documentsRequired: [],
      documentsCollected: [],
      venueRequirements: {},
      serviceDetails: {},
      approvals: [],
      pendingDecisions,
      errors: [],
      currentAgent: 'approval_processor',
      timestamp: new Date(),
    };
  }

  static generateErrorState(familyId: string, errors: string[] = []) {
    return {
      messages: [],
      planningStage: 'error',
      familyRequirements: { familyId },
      culturalRequirements: {},
      documentsRequired: [],
      documentsCollected: [],
      venueRequirements: {},
      serviceDetails: {},
      approvals: [],
      pendingDecisions: [],
      errors,
      currentAgent: 'error_handler',
      timestamp: new Date(),
    };
  }
}

/**
 * Test Data Validation Utilities
 */
export class TestValidationUtils {
  static validateWorkflowState(state: any, expectedStage?: string) {
    expect(state).toBeDefined();
    expect(state.messages).toBeDefined();
    expect(Array.isArray(state.messages)).toBe(true);
    expect(state.planningStage).toBeDefined();
    expect(state.timestamp).toBeDefined();
    expect(state.currentAgent).toBeDefined();

    if (expectedStage) {
      expect(state.planningStage).toBe(expectedStage);
    }
  }

  static validateCulturalAssessment(assessment: any) {
    expect(assessment).toBeDefined();
    expect(assessment.assessment).toBeDefined();
    expect(assessment.identifiedTraditions).toBeDefined();
    expect(assessment.identifiedRites).toBeDefined();
    expect(assessment.recommendations).toBeDefined();
    expect(Array.isArray(assessment.identifiedTraditions)).toBe(true);
    expect(Array.isArray(assessment.identifiedRites)).toBe(true);
    expect(Array.isArray(assessment.recommendations)).toBe(true);
  }

  static validateDecision(decision: any) {
    expect(decision).toBeDefined();
    expect(decision.id).toBeDefined();
    expect(decision.type).toBeDefined();
    expect(decision.priority).toBeDefined();
    expect(decision.title).toBeDefined();
    expect(decision.description).toBeDefined();
    expect(decision.options).toBeDefined();
    expect(Array.isArray(decision.options)).toBe(true);
    expect(decision.requiredApprovers).toBeDefined();
    expect(Array.isArray(decision.requiredApprovers)).toBe(true);
    expect(decision.status).toBeDefined();
  }

  static validateCheckpoint(checkpoint: any) {
    expect(checkpoint).toBeDefined();
    expect(checkpoint.checkpoint).toBeDefined();
    expect(checkpoint.metadata).toBeDefined();
    expect(checkpoint.config).toBeDefined();
  }
}

/**
 * Performance Test Utilities
 */
export class PerformanceTestUtils {
  static async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    return { result, executionTime };
  }

  static async runConcurrentOperations<T>(operations: Array<() => Promise<T>>): Promise<{
    results: T[];
    totalTime: number;
    averageTime: number;
  }> {
    const startTime = Date.now();
    const results = await Promise.all(operations.map(op => op()));
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / operations.length;

    return { results, totalTime, averageTime };
  }

  static generateLoadTestData(count: number, generator: (index: number) => any) {
    return Array.from({ length: count }, (_, index) => generator(index));
  }
}

/**
 * Error Simulation Utilities
 */
export class ErrorSimulationUtils {
  static createNetworkError(message: string = 'Network connection failed') {
    const error = new Error(message);
    error.name = 'NetworkError';
    return error;
  }

  static createValidationError(field: string, value: any) {
    const error = new Error(`Validation failed for field '${field}' with value '${value}'`);
    error.name = 'ValidationError';
    return error;
  }

  static createTimeoutError(operation: string = 'Operation timed out') {
    const error = new Error(operation);
    error.name = 'TimeoutError';
    return error;
  }

  static createDatabaseError(message: string = 'Database operation failed') {
    const error = new Error(message);
    error.name = 'DatabaseError';
    return error;
  }

  static async simulateIntermittentFailure<T>(
    operation: () => Promise<T>,
    failureRate: number = 0.3,
    maxRetries: number = 3
  ): Promise<T> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      attempts++;
      
      if (Math.random() < failureRate) {
        throw new Error(`Simulated failure on attempt ${attempts}`);
      }
      
      try {
        return await operation();
      } catch (error) {
        if (attempts >= maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    
    throw new Error('Maximum retries exceeded');
  }
}

/**
 * Mock Timer Utilities
 */
export class MockTimerUtils {
  static useFakeTimers() {
    jest.useFakeTimers();
  }

  static useRealTimers() {
    jest.useRealTimers();
  }

  static advanceTimersByTime(ms: number) {
    jest.advanceTimersByTime(ms);
  }

  static runAllTimers() {
    jest.runAllTimers();
  }

  static runOnlyPendingTimers() {
    jest.runOnlyPendingTimers();
  }

  static createTimeoutPromise(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createMockDate(dateString: string) {
    const mockDate = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  }
}

/**
 * Test Report Generator
 */
export class TestReportGenerator {
  static generateTestSummary(testResults: any[]) {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const skipped = testResults.filter(r => r.status === 'skipped').length;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: (passed / total) * 100,
      summary: `${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`
    };
  }

  static generatePerformanceReport(performanceData: any[]) {
    const executionTimes = performanceData.map(d => d.executionTime);
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const minTime = Math.min(...executionTimes);
    const maxTime = Math.max(...executionTimes);

    return {
      averageExecutionTime: avgTime,
      minimumExecutionTime: minTime,
      maximumExecutionTime: maxTime,
      totalTests: performanceData.length,
      performanceGrade: avgTime < 1000 ? 'Excellent' : avgTime < 3000 ? 'Good' : 'Needs Improvement'
    };
  }

  static generateCoverageReport(coverageData: any) {
    return {
      workflow: {
        stagesCovered: coverageData.workflow?.stagesCovered || 0,
        totalStages: 9,
        coverage: ((coverageData.workflow?.stagesCovered || 0) / 9) * 100
      },
      cultural: {
        culturesTested: coverageData.cultural?.culturesTested || 0,
        religionsTested: coverageData.cultural?.religionsTested || 0,
        conflictScenarios: coverageData.cultural?.conflictScenarios || 0
      },
      humanLoop: {
        decisionTypesCovered: coverageData.humanLoop?.decisionTypesCovered || 0,
        escalationLevelsTested: coverageData.humanLoop?.escalationLevelsTested || 0,
        interruptScenarios: coverageData.humanLoop?.interruptScenarios || 0
      },
      integration: {
        agentCombinations: coverageData.integration?.agentCombinations || 0,
        endToEndScenarios: coverageData.integration?.endToEndScenarios || 0,
        errorRecoveryScenarios: coverageData.integration?.errorRecoveryScenarios || 0
      }
    };
  }
}

export default {
  MockMessageFactory,
  MockFamilyDataGenerator,
  MockConfigGenerator,
  MockStateGenerator,
  TestValidationUtils,
  PerformanceTestUtils,
  ErrorSimulationUtils,
  MockTimerUtils,
  TestReportGenerator
};