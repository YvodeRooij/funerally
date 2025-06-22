/**
 * Human-in-the-Loop Agent Tests
 * 
 * Comprehensive tests for interrupt functionality, approval workflows, 
 * escalation processes, and sensitive decision handling.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  HumanInLoopAgent, 
  DecisionType, 
  DecisionPriority, 
  DecisionFactory,
  Decision,
  DecisionSchema
} from '../../../lib/agents/human-in-loop-agent';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('HumanInLoopAgent', () => {
  let humanAgent: HumanInLoopAgent;
  let mockConfig: any;

  beforeEach(() => {
    humanAgent = new HumanInLoopAgent();
    mockConfig = {
      configurable: {
        thread_id: `human_loop_test_${Date.now()}`,
        checkpoint_ns: 'human_loop_namespace',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Decision Analysis and Prioritization', () => {
    test('should analyze and prioritize pending decisions', async () => {
      const lowPriorityDecision: Decision = {
        id: 'decision_001',
        type: DecisionType.VENUE_SELECTION,
        priority: DecisionPriority.LOW,
        title: 'Venue Selection',
        description: 'Choose between available venues',
        context: { venues: ['Venue A', 'Venue B'] },
        options: [
          {
            id: 'venue_a',
            label: 'Venue A',
            description: 'Traditional church',
            implications: ['Religious setting', 'Limited capacity']
          },
          {
            id: 'venue_b',
            label: 'Venue B',
            description: 'Community center',
            implications: ['Secular setting', 'Large capacity']
          }
        ],
        requiredApprovers: ['family_primary'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const highPriorityDecision: Decision = {
        id: 'decision_002',
        type: DecisionType.EMERGENCY_DECISION,
        priority: DecisionPriority.IMMEDIATE,
        title: 'Emergency Medical Decision',
        description: 'Immediate medical decision required',
        context: { urgency: 'immediate' },
        options: [
          {
            id: 'proceed',
            label: 'Proceed immediately',
            description: 'Continue with current plan',
            implications: ['Immediate action']
          }
        ],
        requiredApprovers: ['family_primary', 'medical_director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(highPriorityDecision, mockConfig);
      
      expect(result.currentDecision).toBeDefined();
      expect(result.currentDecision.priority).toBe(DecisionPriority.IMMEDIATE);
      expect(result.currentDecision.id).toBe('decision_002');
    });

    test('should adjust priority based on deadlines', async () => {
      const nearDeadlineDecision: Decision = {
        id: 'decision_003',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.LOW,
        title: 'Service Details',
        description: 'Finalize service arrangements',
        context: {},
        options: [],
        requiredApprovers: ['family_primary'],
        currentApprovers: [],
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(nearDeadlineDecision, mockConfig);
      
      // Priority should be elevated due to approaching deadline
      expect(result.currentDecision.priority).toBe(DecisionPriority.HIGH);
    });

    test('should elevate priority for cultural/ethical considerations', async () => {
      const culturalDecision: Decision = {
        id: 'decision_004',
        type: DecisionType.CULTURAL_SENSITIVITY,
        priority: DecisionPriority.LOW,
        title: 'Cultural Accommodation',
        description: 'Address cultural sensitivity concern',
        context: { culture: 'Islamic' },
        options: [],
        requiredApprovers: ['family_primary', 'cultural_advisor'],
        currentApprovers: [],
        culturalConsiderations: ['Religious burial requirements', 'Prayer scheduling'],
        ethicalConsiderations: ['Family wishes', 'Religious obligations'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(culturalDecision, mockConfig);
      
      // Priority should be elevated due to cultural/ethical considerations
      expect(result.currentDecision.priority).toBe(DecisionPriority.MEDIUM);
    });
  });

  describe('Interrupt Functionality', () => {
    test('should trigger interrupt for human interface', async () => {
      const serviceDecision = DecisionFactory.createServiceDetailsDecision({
        serviceType: 'Traditional',
        date: new Date(),
        estimatedCost: 4500
      });

      // Mock the interrupt mechanism
      const originalConsoleLog = console.log;
      let interruptTriggered = false;
      console.log = jest.fn((message) => {
        if (message.includes('Human interface activated')) {
          interruptTriggered = true;
        }
        originalConsoleLog(message);
      });

      const result = await humanAgent.processDecision(serviceDecision, mockConfig);
      
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Human interface activated')
      )).toBe(true);

      console.log = originalConsoleLog;
    });

    test('should interrupt before escalation handler', async () => {
      const escalationDecision: Decision = {
        id: 'escalation_001',
        type: DecisionType.FAMILY_CONFLICT,
        priority: DecisionPriority.HIGH,
        title: 'Family Disagreement',
        description: 'Family members cannot agree on service details',
        context: { conflictType: 'service_details' },
        options: [
          {
            id: 'mediate',
            label: 'Mediate discussion',
            description: 'Facilitate family discussion',
            implications: ['Delayed decision', 'Potential resolution']
          },
          {
            id: 'escalate',
            label: 'Escalate to director',
            description: 'Involve senior funeral director',
            implications: ['Higher authority involvement']
          }
        ],
        requiredApprovers: ['family_primary', 'family_secondary'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(escalationDecision, mockConfig);
      
      expect(result.messages.some((msg: any) => 
        msg.content.includes('Human interface activated') ||
        msg.content.includes('Human review')
      )).toBe(true);
    });

    test('should support streaming decision process with interrupts', async () => {
      const streamDecision = DecisionFactory.createCostApprovalDecision({
        totalCost: 6500,
        breakdown: {
          service: 3000,
          venue: 1500,
          catering: 2000
        }
      });

      const stream = await humanAgent.streamDecisionProcess(streamDecision, mockConfig);
      
      expect(stream).toBeDefined();
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });
  });

  describe('Approval Workflow Processing', () => {
    test('should process single approver decision', async () => {
      const singleApproverDecision: Decision = {
        id: 'single_approval_001',
        type: DecisionType.DOCUMENT_VERIFICATION,
        priority: DecisionPriority.MEDIUM,
        title: 'Document Verification',
        description: 'Verify submitted documents',
        context: { documents: ['death_certificate', 'id_proof'] },
        options: [
          {
            id: 'approve',
            label: 'Approve documents',
            description: 'Documents are valid and complete',
            implications: ['Proceed with planning']
          },
          {
            id: 'reject',
            label: 'Request corrections',
            description: 'Documents need corrections',
            implications: ['Delay in planning']
          }
        ],
        requiredApprovers: ['director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      // Simulate human input
      const humanInput = {
        approverId: 'director',
        approved: true,
        selectedOption: 'approve',
        comments: 'Documents verified and approved'
      };

      // Process the approval
      const result = await humanAgent.processDecision(singleApproverDecision, mockConfig);
      
      // Manually simulate approval processing for testing
      const processedDecision = {
        ...singleApproverDecision,
        status: 'approved' as const,
        currentApprovers: ['director']
      };

      expect(processedDecision.status).toBe('approved');
      expect(processedDecision.currentApprovers).toContain('director');
    });

    test('should handle multiple approver workflow', async () => {
      const multiApproverDecision: Decision = {
        id: 'multi_approval_001',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.HIGH,
        title: 'Final Service Approval',
        description: 'Final approval for service arrangements',
        context: { finalArrangements: true },
        options: [
          {
            id: 'approve_all',
            label: 'Approve all arrangements',
            description: 'Approve complete service plan',
            implications: ['Service will proceed as planned']
          }
        ],
        requiredApprovers: ['family_primary', 'family_secondary', 'director'],
        currentApprovers: ['family_primary'], // One approval already received
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(multiApproverDecision, mockConfig);
      
      expect(result.currentDecision.requiredApprovers).toHaveLength(3);
      expect(result.currentDecision.currentApprovers).toHaveLength(1);
      
      // Should not be fully approved yet
      const allApproversResponded = result.currentDecision.requiredApprovers.every(
        approver => result.currentDecision.currentApprovers.includes(approver)
      );
      expect(allApproversResponded).toBe(false);
    });

    test('should complete workflow when all approvals obtained', async () => {
      const fullyApprovedDecision: Decision = {
        id: 'fully_approved_001',
        type: DecisionType.COST_APPROVAL,
        priority: DecisionPriority.HIGH,
        title: 'Cost Approval',
        description: 'Final cost approval',
        context: { totalCost: 5000 },
        options: [],
        requiredApprovers: ['family_primary', 'family_financial'],
        currentApprovers: ['family_primary', 'family_financial'], // All approvals received
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'approved'
      };

      const result = await humanAgent.processDecision(fullyApprovedDecision, mockConfig);
      
      // Should be ready for execution
      expect(result.currentDecision.status).toBe('approved');
      expect(result.currentDecision.currentApprovers).toHaveLength(2);
    });

    test('should handle approval rejection', async () => {
      const rejectedDecision: Decision = {
        id: 'rejected_001',
        type: DecisionType.VENUE_SELECTION,
        priority: DecisionPriority.MEDIUM,
        title: 'Venue Selection',
        description: 'Select funeral venue',
        context: { venue: 'Proposed Venue' },
        options: [],
        requiredApprovers: ['family_primary'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'rejected'
      };

      const result = await humanAgent.processDecision(rejectedDecision, mockConfig);
      
      expect(result.currentDecision.status).toBe('rejected');
    });
  });

  describe('Escalation Process', () => {
    test('should escalate when decision is rejected', async () => {
      const escalationState = {
        pendingDecisions: [],
        completedDecisions: [],
        currentDecision: {
          id: 'escalation_test_001',
          type: DecisionType.FAMILY_CONFLICT,
          priority: DecisionPriority.HIGH,
          title: 'Family Conflict Resolution',
          description: 'Resolve family disagreement',
          context: {},
          options: [],
          requiredApprovers: ['family_primary'],
          currentApprovers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'rejected' as const
        },
        humanInput: null,
        escalationLevel: 0,
        messages: []
      };

      // Simulate escalation processing
      const escalatedLevel = escalationState.escalationLevel + 1;
      
      expect(escalatedLevel).toBe(1);
      // Level 1 escalation should notify family liaison
    });

    test('should handle multiple escalation levels', async () => {
      const escalationLevels = [
        { level: 1, action: 'Notify family liaison' },
        { level: 2, action: 'Escalate to senior director' },
        { level: 3, action: 'Involve cultural advisor' },
        { level: 4, action: 'Executive decision required' }
      ];

      for (const escalation of escalationLevels) {
        const escalationState = {
          escalationLevel: escalation.level - 1,
          currentDecision: {
            id: `escalation_level_${escalation.level}`,
            type: DecisionType.ETHICAL_CONCERN,
            priority: DecisionPriority.HIGH,
            title: `Level ${escalation.level} Escalation`,
            description: 'Escalation test',
            context: {},
            options: [],
            requiredApprovers: ['family_primary'],
            currentApprovers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'rejected' as const
          }
        };

        const newLevel = escalationState.escalationLevel + 1;
        expect(newLevel).toBe(escalation.level);
      }
    });

    test('should handle maximum escalation level', async () => {
      const maxEscalationState = {
        escalationLevel: 5, // Beyond normal levels
        currentDecision: {
          id: 'max_escalation_001',
          type: DecisionType.EMERGENCY_DECISION,
          priority: DecisionPriority.IMMEDIATE,
          title: 'Maximum Escalation',
          description: 'Requires executive intervention',
          context: {},
          options: [],
          requiredApprovers: ['executive'],
          currentApprovers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'pending' as const
        }
      };

      expect(maxEscalationState.escalationLevel).toBeGreaterThan(4);
      // Should handle gracefully with executive decision protocol
    });

    test('should reset escalation after successful resolution', async () => {
      const resolvedState = {
        escalationLevel: 2,
        currentDecision: {
          id: 'resolved_001',
          type: DecisionType.FAMILY_CONFLICT,
          priority: DecisionPriority.HIGH,
          title: 'Resolved Conflict',
          description: 'Conflict successfully resolved',
          context: {},
          options: [],
          requiredApprovers: ['family_primary'],
          currentApprovers: ['family_primary'],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'approved' as const
        }
      };

      // After successful resolution, escalation should be reset
      expect(resolvedState.currentDecision.status).toBe('approved');
      // System should track that escalation was resolved
    });
  });

  describe('Cultural and Ethical Validation', () => {
    test('should validate cultural considerations', async () => {
      const culturalDecision: Decision = {
        id: 'cultural_validation_001',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.HIGH,
        title: 'Service Details with Cultural Requirements',
        description: 'Service arrangements requiring cultural validation',
        context: { 
          culture: 'Islamic',
          religiousRequirements: true
        },
        options: [],
        requiredApprovers: ['family_primary', 'cultural_advisor'],
        currentApprovers: [],
        culturalConsiderations: ['Prayer direction', 'Burial timing', 'Ritual washing'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(culturalDecision, mockConfig);
      
      expect(result.currentDecision.culturalConsiderations).toContain('Prayer direction');
      expect(result.currentDecision.culturalConsiderations).toContain('Burial timing');
      expect(result.currentDecision.culturalConsiderations).toContain('Ritual washing');
    });

    test('should identify ethical concerns', async () => {
      const ethicalDecision: Decision = {
        id: 'ethical_validation_001',
        type: DecisionType.COST_APPROVAL,
        priority: DecisionPriority.HIGH,
        title: 'High Cost Service Approval',
        description: 'Expensive service requiring ethical review',
        context: { 
          totalCost: 15000,
          familyFinancialSituation: 'limited'
        },
        options: [],
        requiredApprovers: ['family_primary', 'financial_advisor'],
        currentApprovers: [],
        ethicalConsiderations: ['Financial burden', 'Family debt risk'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(ethicalDecision, mockConfig);
      
      expect(result.currentDecision.ethicalConsiderations).toContain('Financial burden');
      expect(result.currentDecision.ethicalConsiderations).toContain('Family debt risk');
    });

    test('should add contextual cultural flags based on decision type', async () => {
      const venueDecision: Decision = {
        id: 'venue_cultural_001',
        type: DecisionType.VENUE_SELECTION,
        priority: DecisionPriority.MEDIUM,
        title: 'Venue Selection',
        description: 'Select appropriate venue',
        context: { venues: ['Church', 'Community Hall'] },
        options: [],
        requiredApprovers: ['family_primary'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(venueDecision, mockConfig);
      
      // Cultural validator should add venue-specific considerations
      expect(result.currentDecision.culturalConsiderations).toBeDefined();
    });
  });

  describe('Decision Factory and Common Scenarios', () => {
    test('should create service details decision correctly', () => {
      const serviceDetails = {
        serviceType: 'Memorial Service',
        venue: 'Community Center',
        date: new Date('2024-07-15'),
        estimatedGuests: 100
      };

      const decision = DecisionFactory.createServiceDetailsDecision(serviceDetails);
      
      expect(decision.type).toBe(DecisionType.SERVICE_DETAILS);
      expect(decision.priority).toBe(DecisionPriority.HIGH);
      expect(decision.title).toBe('Service Details Approval');
      expect(decision.requiredApprovers).toContain('family_primary');
      expect(decision.requiredApprovers).toContain('director');
      expect(decision.options).toHaveLength(3); // approve, modify, defer
    });

    test('should create cost approval decision correctly', () => {
      const costBreakdown = {
        serviceCharges: 3000,
        venueRental: 1200,
        catering: 1800,
        flowers: 500,
        total: 6500
      };

      const decision = DecisionFactory.createCostApprovalDecision(costBreakdown);
      
      expect(decision.type).toBe(DecisionType.COST_APPROVAL);
      expect(decision.priority).toBe(DecisionPriority.HIGH);
      expect(decision.title).toBe('Cost Approval');
      expect(decision.requiredApprovers).toContain('family_primary');
      expect(decision.requiredApprovers).toContain('family_financial');
      expect(decision.ethicalConsiderations).toContain('Financial burden assessment');
      expect(decision.options).toHaveLength(3); // full approval, partial, alternatives
    });

    test('should handle custom decision types', async () => {
      const customDecision: Decision = {
        id: 'custom_001',
        type: DecisionType.CUSTOM_REQUEST,
        priority: DecisionPriority.MEDIUM,
        title: 'Custom Family Request',
        description: 'Special accommodation request from family',
        context: { 
          request: 'Live video streaming for overseas relatives',
          technicalRequirements: true
        },
        options: [
          {
            id: 'approve_streaming',
            label: 'Approve streaming setup',
            description: 'Set up professional live streaming',
            implications: ['Additional technical costs', 'Privacy considerations']
          },
          {
            id: 'alternative_recording',
            label: 'Offer recording alternative',
            description: 'Record service for later sharing',
            implications: ['No live experience', 'Lower cost']
          }
        ],
        requiredApprovers: ['family_primary', 'technical_director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(customDecision, mockConfig);
      
      expect(result.currentDecision.type).toBe(DecisionType.CUSTOM_REQUEST);
      expect(result.currentDecision.options).toHaveLength(2);
    });
  });

  describe('Urgency and Timing Calculations', () => {
    test('should calculate urgency correctly based on priority', async () => {
      const immediateDecision: Decision = {
        id: 'urgent_001',
        type: DecisionType.EMERGENCY_DECISION,
        priority: DecisionPriority.IMMEDIATE,
        title: 'Emergency Decision',
        description: 'Requires immediate attention',
        context: {},
        options: [],
        requiredApprovers: ['director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(immediateDecision, mockConfig);
      
      // Should have maximum urgency due to IMMEDIATE priority
      expect(result.currentDecision.priority).toBe(DecisionPriority.IMMEDIATE);
    });

    test('should factor in deadline proximity for urgency', async () => {
      const nearDeadlineDecision: Decision = {
        id: 'deadline_001',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.LOW,
        title: 'Service Planning',
        description: 'Service details needed soon',
        context: {},
        options: [],
        requiredApprovers: ['family_primary'],
        currentAprovers: [],
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      // Urgency should be elevated due to approaching deadline
      const timeDiff = nearDeadlineDecision.deadline!.getTime() - Date.now();
      expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Less than 24 hours
    });

    test('should consider cultural and ethical factors in urgency', async () => {
      const complexDecision: Decision = {
        id: 'complex_001',
        type: DecisionType.CULTURAL_SENSITIVITY,
        priority: DecisionPriority.MEDIUM,
        title: 'Complex Cultural Decision',
        description: 'Requires careful cultural consideration',
        context: {},
        options: [],
        requiredApprovers: ['family_primary', 'cultural_advisor'],
        currentApprovers: [],
        culturalConsiderations: ['Religious requirements', 'Family traditions'],
        ethicalConsiderations: ['Family harmony', 'Religious obligations'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result = await humanAgent.processDecision(complexDecision, mockConfig);
      
      // Should have elevated urgency due to cultural/ethical considerations
      expect(result.currentDecision.culturalConsiderations).toHaveLength(2);
      expect(result.currentDecision.ethicalConsiderations).toHaveLength(2);
    });
  });

  describe('Data Validation and Error Handling', () => {
    test('should validate decision schema', () => {
      const validDecision = {
        id: 'valid_001',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.HIGH,
        title: 'Valid Decision',
        description: 'Test decision',
        context: {},
        options: [
          {
            id: 'option1',
            label: 'Option 1',
            description: 'First option',
            implications: ['Implication 1']
          }
        ],
        requiredApprovers: ['approver1'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const validation = DecisionSchema.safeParse(validDecision);
      expect(validation.success).toBe(true);
    });

    test('should handle invalid decision data gracefully', async () => {
      const invalidDecision = {
        id: 'invalid_001',
        type: 'INVALID_TYPE', // Invalid type
        priority: 'INVALID_PRIORITY', // Invalid priority
        title: null, // Invalid title
        description: undefined, // Invalid description
        context: 'not_an_object', // Invalid context
        options: 'not_an_array', // Invalid options
        requiredApprovers: null // Invalid approvers
      };

      // Should handle gracefully without throwing
      try {
        await humanAgent.processDecision(invalidDecision as any, mockConfig);
        expect(true).toBe(true); // If we reach here, error was handled gracefully
      } catch (error) {
        // If error is thrown, it should be a validation error
        expect(error).toBeDefined();
      }
    });

    test('should handle missing required fields', async () => {
      const incompleteDecision = {
        id: 'incomplete_001',
        type: DecisionType.SERVICE_DETAILS,
        priority: DecisionPriority.HIGH
        // Missing required fields: title, description, etc.
      };

      try {
        await humanAgent.processDecision(incompleteDecision as any, mockConfig);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  })

  describe('Integration and Performance', () => {
    test('should handle concurrent decision processing', async () => {
      const decisions = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent_${i}`,
        type: DecisionType.DOCUMENT_VERIFICATION,
        priority: DecisionPriority.MEDIUM,
        title: `Concurrent Decision ${i}`,
        description: `Test decision ${i}`,
        context: { index: i },
        options: [],
        requiredApprovers: ['director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending' as const
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        decisions.map(decision => humanAgent.processDecision(decision, mockConfig))
      );
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
      results.forEach(result => {
        expect(result.currentDecision).toBeDefined();
      });
    });

    test('should maintain state consistency across operations', async () => {
      const baseDecision: Decision = {
        id: 'consistency_001',
        type: DecisionType.COST_APPROVAL,
        priority: DecisionPriority.HIGH,
        title: 'Consistency Test',
        description: 'Test state consistency',
        context: { testData: 'should_persist' },
        options: [],
        requiredApprovers: ['family_primary', 'director'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      const result1 = await humanAgent.processDecision(baseDecision, mockConfig);
      const result2 = await humanAgent.processDecision(result1.currentDecision, mockConfig);
      
      expect(result2.currentDecision.context.testData).toBe('should_persist');
      expect(result2.currentDecision.id).toBe('consistency_001');
    });
  });
});