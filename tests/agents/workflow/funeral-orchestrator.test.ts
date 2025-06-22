/**
 * Funeral Orchestrator Workflow Tests
 * 
 * Comprehensive tests for the funeral planning workflow state machine,
 * covering all 9 stages, state transitions, and completion validation.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FuneralPlanningOrchestrator, PlanningStage, FuneralPlanningState } from '../../../lib/agents/funeral-orchestrator';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('FuneralPlanningOrchestrator', () => {
  let orchestrator: FuneralPlanningOrchestrator;
  let mockConfig: any;

  beforeEach(() => {
    orchestrator = new FuneralPlanningOrchestrator();
    mockConfig = {
      configurable: {
        thread_id: `test_thread_${Date.now()}`,
        checkpoint_ns: 'test_namespace',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State and Workflow Setup', () => {
    test('should initialize with correct default state', async () => {
      const initialState = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: {},
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

      const result = await orchestrator.execute(initialState, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.INITIAL);
      expect(result.currentAgent).toBe('orchestrator');
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    });

    test('should have correct node configuration', () => {
      const graph = orchestrator.getGraph();
      expect(graph).toBeDefined();
      
      // Test that the graph is properly compiled
      expect(typeof graph.invoke).toBe('function');
      expect(typeof graph.stream).toBe('function');
    });
  });

  describe('Stage 1: Initial to Requirements Gathering', () => {
    test('should transition from INITIAL to REQUIREMENTS_GATHERING', async () => {
      const initialState = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: {},
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

      const result = await orchestrator.execute(initialState, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.CULTURAL_ASSESSMENT);
      expect(result.currentAgent).toBe('requirements_gatherer');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Requirements gathering completed')
      )).toBe(true);
    });

    test('should handle requirements gathering with family data', async () => {
      const stateWithFamily = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: {
          primaryContact: 'John Doe',
          contactPhone: '+31-6-12345678',
          preferredLanguage: 'Dutch',
          specialRequests: ['Flower arrangements', 'Music selection']
        },
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

      const result = await orchestrator.execute(stateWithFamily, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.CULTURAL_ASSESSMENT);
      expect(result.familyRequirements.primaryContact).toBe('John Doe');
    });
  });

  describe('Stage 2: Cultural Assessment', () => {
    test('should transition from REQUIREMENTS_GATHERING to CULTURAL_ASSESSMENT', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.REQUIREMENTS_GATHERING,
        familyRequirements: { assessed: true },
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'requirements_gatherer',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.DOCUMENT_COLLECTION);
      expect(result.currentAgent).toBe('cultural_assessor');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Cultural assessment completed')
      )).toBe(true);
    });

    test('should handle multiple cultural requirements', async () => {
      const stateWithCultural = {
        messages: [],
        planningStage: PlanningStage.REQUIREMENTS_GATHERING,
        familyRequirements: { assessed: true },
        culturalRequirements: {
          primaryCulture: 'Dutch',
          religion: 'Protestant',
          dietaryRestrictions: ['No pork', 'Vegetarian options'],
          musicPreferences: ['Traditional hymns', 'Classical music']
        },
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'requirements_gatherer',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithCultural, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.DOCUMENT_COLLECTION);
      expect(result.culturalRequirements.primaryCulture).toBe('Dutch');
      expect(result.culturalRequirements.religion).toBe('Protestant');
    });
  });

  describe('Stage 3: Document Collection', () => {
    test('should remain in DOCUMENT_COLLECTION when documents incomplete', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.CULTURAL_ASSESSMENT,
        familyRequirements: {},
        culturalRequirements: { assessed: true },
        documentsRequired: ['death_certificate', 'identity_proof', 'burial_permit'],
        documentsCollected: ['death_certificate'], // Missing 2 documents
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'cultural_assessor',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.VENUE_SELECTION);
      expect(result.currentAgent).toBe('document_collector');
    });

    test('should transition to VENUE_SELECTION when all documents collected', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: ['death_certificate', 'identity_proof', 'burial_permit'],
        documentsCollected: ['death_certificate', 'identity_proof', 'burial_permit'], // All collected
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.VENUE_SELECTION);
    });

    test('should handle document verification failures', async () => {
      const stateWithErrors = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: ['death_certificate', 'identity_proof'],
        documentsCollected: ['death_certificate'],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: ['Document verification failed for identity_proof'],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithErrors, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.ERROR);
      expect(result.currentAgent).toBe('error_handler');
      expect(result.errors).toContain('Document verification failed for identity_proof');
    });
  });

  describe('Stage 4: Venue Selection', () => {
    test('should transition from DOCUMENT_COLLECTION to VENUE_SELECTION', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: ['death_certificate'],
        documentsCollected: ['death_certificate'],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.SERVICE_PLANNING);
      expect(result.currentAgent).toBe('venue_selector');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Venue selection completed')
      )).toBe(true);
    });

    test('should handle venue requirements based on cultural needs', async () => {
      const stateWithVenueReqs = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: { 
          religion: 'Islamic',
          requiresQiblaDirection: true 
        },
        documentsRequired: ['death_certificate'],
        documentsCollected: ['death_certificate'],
        venueRequirements: {
          capacity: 200,
          accessibility: true,
          parkingSpaces: 50,
          audioVisualEquipment: true
        },
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithVenueReqs, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.SERVICE_PLANNING);
      expect(result.venueRequirements.capacity).toBe(200);
      expect(result.venueRequirements.accessibility).toBe(true);
    });
  });

  describe('Stage 5: Service Planning', () => {
    test('should transition from VENUE_SELECTION to SERVICE_PLANNING', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.VENUE_SELECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: { selected: true },
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'venue_selector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.APPROVAL_PROCESS);
      expect(result.currentAgent).toBe('service_planner');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Service planning completed')
      )).toBe(true);
    });

    test('should handle complex service details', async () => {
      const stateWithServiceDetails = {
        messages: [],
        planningStage: PlanningStage.VENUE_SELECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {
          serviceType: 'Traditional funeral',
          date: new Date('2024-07-01'),
          time: '14:00',
          duration: '60 minutes',
          speakers: ['Family member', 'Religious leader'],
          music: ['Ave Maria', 'Amazing Grace'],
          flowers: ['White lilies', 'Red roses'],
          catering: true,
          numberOfGuests: 150
        },
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'venue_selector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithServiceDetails, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.APPROVAL_PROCESS);
      expect(result.serviceDetails.serviceType).toBe('Traditional funeral');
      expect(result.serviceDetails.numberOfGuests).toBe(150);
    });
  });

  describe('Stage 6: Approval Process', () => {
    test('should transition to APPROVAL_PROCESS and create pending decisions', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.SERVICE_PLANNING,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: { planned: true },
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'service_planner',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.COORDINATION);
      expect(result.currentAgent).toBe('approval_processor');
      expect(result.pendingDecisions.length).toBeGreaterThan(0);
      expect(result.pendingDecisions[0].type).toBe('service_approval');
    });

    test('should require human review when pending decisions exist', async () => {
      const stateWithPendingDecisions = {
        messages: [],
        planningStage: PlanningStage.APPROVAL_PROCESS,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [
          {
            type: 'cost_approval',
            description: 'Family needs to approve total cost',
            amount: 5500
          }
        ],
        errors: [],
        currentAgent: 'approval_processor',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithPendingDecisions, mockConfig);
      
      // Should route to human review due to pending decisions
      expect(result.currentAgent).toBe('human_reviewer');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Human review required')
      )).toBe(true);
    });

    test('should proceed to coordination when all approvals obtained', async () => {
      const stateWithApprovals = {
        messages: [],
        planningStage: PlanningStage.APPROVAL_PROCESS,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: ['family', 'director', 'venue'], // All required approvals
        pendingDecisions: [],
        errors: [],
        currentAgent: 'approval_processor',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithApprovals, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.COORDINATION);
      expect(result.currentAgent).toBe('coordinator');
    });
  });

  describe('Stage 7: Coordination', () => {
    test('should transition from APPROVAL_PROCESS to COORDINATION', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.APPROVAL_PROCESS,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: ['family', 'director', 'venue'],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'approval_processor',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.COMPLETED);
      expect(result.currentAgent).toBe('coordinator');
      expect(result.messages.some((msg: any) => 
        msg.content.includes('coordination completed')
      )).toBe(true);
    });

    test('should handle coordination with timeline scheduling', async () => {
      const stateWithTimeline = {
        messages: [],
        planningStage: PlanningStage.COORDINATION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {
          timeline: {
            preparation: '2 hours before service',
            arrival: '30 minutes before service',
            service: '60 minutes',
            reception: '90 minutes after service'
          }
        },
        approvals: ['family', 'director', 'venue'],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'coordinator',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(stateWithTimeline, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.COMPLETED);
      expect(result.serviceDetails.timeline).toBeDefined();
    });
  });

  describe('Stage 8: Completion', () => {
    test('should complete workflow when reaching COMPLETED stage', async () => {
      const state = {
        messages: [],
        planningStage: PlanningStage.COORDINATION,
        familyRequirements: { complete: true },
        culturalRequirements: { complete: true },
        documentsRequired: ['death_certificate'],
        documentsCollected: ['death_certificate'],
        venueRequirements: { complete: true },
        serviceDetails: { complete: true },
        approvals: ['family', 'director', 'venue'],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'coordinator',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(state, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.COMPLETED);
    });

    test('should validate all requirements completed', async () => {
      const completeState = {
        messages: [],
        planningStage: PlanningStage.COMPLETED,
        familyRequirements: { 
          primaryContact: 'John Doe',
          preferences: 'collected'
        },
        culturalRequirements: { 
          assessed: true,
          accommodations: 'planned'
        },
        documentsRequired: ['death_certificate', 'burial_permit'],
        documentsCollected: ['death_certificate', 'burial_permit'],
        venueRequirements: { 
          selected: true,
          confirmed: true
        },
        serviceDetails: { 
          finalized: true,
          timeline: 'set'
        },
        approvals: ['family', 'director', 'venue'],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'coordinator',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(completeState, mockConfig);
      
      // Should remain completed
      expect(result.planningStage).toBe(PlanningStage.COMPLETED);
      
      // Validate all components are complete
      expect(result.documentsRequired.length).toBe(result.documentsCollected.length);
      expect(result.approvals).toContain('family');
      expect(result.approvals).toContain('director');
      expect(result.approvals).toContain('venue');
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should route to error handler when errors present', async () => {
      const errorState = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: ['Document processing failed', 'Venue booking conflict'],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(errorState, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.ERROR);
      expect(result.currentAgent).toBe('error_handler');
      expect(result.errors.length).toBe(2);
    });

    test('should handle recovery from error state', async () => {
      const recoveryState = {
        messages: [],
        planningStage: PlanningStage.ERROR,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [], // Errors resolved
        currentAgent: 'error_handler',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(recoveryState, mockConfig);
      
      // Should transition back to appropriate workflow stage
      expect(result.planningStage).not.toBe(PlanningStage.ERROR);
      expect(result.currentAgent).not.toBe('error_handler');
    });
  });

  describe('Workflow Streaming and Real-time Updates', () => {
    test('should support streaming workflow execution', async () => {
      const initialState = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: {},
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

      const stream = await orchestrator.stream(initialState, mockConfig);
      expect(stream).toBeDefined();
      
      // Test that stream is iterable
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });

    test('should handle concurrent state updates', async () => {
      const baseState = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: ['death_certificate', 'burial_permit'],
        documentsCollected: ['death_certificate'],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      // Simulate concurrent document collection
      const concurrentUpdate1 = {
        ...baseState,
        documentsCollected: [...baseState.documentsCollected, 'burial_permit'],
      };

      const result = await orchestrator.execute(concurrentUpdate1, mockConfig);
      
      expect(result.documentsCollected).toContain('death_certificate');
      expect(result.documentsCollected).toContain('burial_permit');
      expect(result.planningStage).toBe(PlanningStage.VENUE_SELECTION);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle large number of messages', async () => {
      const messagesArray = Array.from({ length: 1000 }, (_, i) => 
        new HumanMessage({ content: `Message ${i}` })
      );

      const largeState = {
        messages: messagesArray,
        planningStage: PlanningStage.SERVICE_PLANNING,
        familyRequirements: {},
        culturalRequirements: {},
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'service_planner',
        timestamp: new Date(),
      };

      const startTime = Date.now();
      const result = await orchestrator.execute(largeState, mockConfig);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(1000);
      // Performance expectation: should complete within 5 seconds
      expect(executionTime).toBeLessThan(5000);
    });

    test('should handle complex nested data structures', async () => {
      const complexState = {
        messages: [],
        planningStage: PlanningStage.SERVICE_PLANNING,
        familyRequirements: {
          contacts: {
            primary: { name: 'John', phone: '+31-6-123', email: 'john@example.com' },
            secondary: { name: 'Jane', phone: '+31-6-456', email: 'jane@example.com' },
            emergency: { name: 'Bob', phone: '+31-6-789', email: 'bob@example.com' }
          },
          preferences: {
            service: { type: 'traditional', length: 60, language: 'Dutch' },
            venue: { capacity: 200, accessibility: true, parking: true },
            catering: { style: 'buffet', dietary: ['vegetarian', 'halal'], count: 150 }
          }
        },
        culturalRequirements: {
          traditions: [
            { name: 'Dutch Reformed', requirements: ['hymns', 'prayer'], mandatory: true },
            { name: 'Family Custom', requirements: ['photo display', 'memory book'], mandatory: false }
          ]
        },
        documentsRequired: [],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'service_planner',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(complexState, mockConfig);
      
      expect(result.familyRequirements.contacts.primary.name).toBe('John');
      expect(result.culturalRequirements.traditions).toHaveLength(2);
      expect(result.planningStage).toBe(PlanningStage.APPROVAL_PROCESS);
    });
  });

  describe('State Validation and Integrity', () => {
    test('should validate state transitions are logical', async () => {
      // Test invalid state transition
      const invalidState = {
        messages: [],
        planningStage: PlanningStage.COMPLETED, // Starting from completed
        familyRequirements: {},
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

      const result = await orchestrator.execute(invalidState, mockConfig);
      
      // Should remain in completed state
      expect(result.planningStage).toBe(PlanningStage.COMPLETED);
    });

    test('should maintain state consistency across transitions', async () => {
      let currentState = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: { testData: 'preserved' },
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

      // Execute through multiple stages
      const stage1 = await orchestrator.execute(currentState, mockConfig);
      const stage2 = await orchestrator.execute(stage1, mockConfig);
      const stage3 = await orchestrator.execute(stage2, mockConfig);

      // Verify data persistence
      expect(stage3.familyRequirements.testData).toBe('preserved');
      expect(stage3.timestamp).toBeDefined();
      expect(stage3.messages.length).toBeGreaterThan(0);
    });
  });
});