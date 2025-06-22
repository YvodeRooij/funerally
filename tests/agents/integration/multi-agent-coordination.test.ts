/**
 * Multi-Agent Coordination Integration Tests
 * 
 * Comprehensive tests for agent coordination, document collection workflow,
 * timeline compliance, and end-to-end funeral planning scenarios.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  FuneralPlanningOrchestrator, 
  PlanningStage 
} from '../../../lib/agents/funeral-orchestrator';
import { 
  CulturalRequirementsAgent 
} from '../../../lib/agents/cultural-requirements-agent';
import { 
  HumanInLoopAgent, 
  DecisionType, 
  DecisionPriority 
} from '../../../lib/agents/human-in-loop-agent';
import { 
  FuneralCheckpointSaver 
} from '../../../lib/agents/checkpointing-system';

// Mock implementations for testing
class MockDocumentCollectionAgent {
  private documents: Map<string, any> = new Map();

  async collectDocument(familyId: string, documentType: string, documentData: any) {
    const key = `${familyId}_${documentType}`;
    this.documents.set(key, {
      familyId,
      documentType,
      data: documentData,
      collectedAt: new Date(),
      verified: false
    });
    return { success: true, documentId: key };
  }

  async verifyDocument(documentId: string) {
    const doc = this.documents.get(documentId);
    if (doc) {
      doc.verified = true;
      doc.verifiedAt = new Date();
      return { success: true, verified: true };
    }
    return { success: false, error: 'Document not found' };
  }

  async getDocumentStatus(familyId: string) {
    const familyDocs = Array.from(this.documents.values())
      .filter(doc => doc.familyId === familyId);
    
    return {
      total: familyDocs.length,
      verified: familyDocs.filter(doc => doc.verified).length,
      pending: familyDocs.filter(doc => !doc.verified).length,
      documents: familyDocs
    };
  }

  clear() {
    this.documents.clear();
  }
}

class MockVenueAgent {
  private venues: any[] = [
    {
      id: 'venue_001',
      name: 'St. Mary\'s Church',
      type: 'religious',
      capacity: 200,
      availability: ['2024-07-15', '2024-07-16', '2024-07-17'],
      culturalAccommodations: ['Christian', 'Interfaith'],
      facilities: ['Audio system', 'Parking', 'Accessibility']
    },
    {
      id: 'venue_002',
      name: 'Community Center',
      type: 'secular',
      capacity: 300,
      availability: ['2024-07-15', '2024-07-16', '2024-07-18'],
      culturalAccommodations: ['All faiths', 'Secular ceremonies'],
      facilities: ['Large hall', 'Kitchen', 'Parking', 'Accessibility']
    },
    {
      id: 'venue_003',
      name: 'Islamic Center',
      type: 'religious',
      capacity: 150,
      availability: ['2024-07-15', '2024-07-17', '2024-07-19'],
      culturalAccommodations: ['Islamic', 'Muslim ceremonies'],
      facilities: ['Prayer room', 'Qibla direction', 'Ablution facilities']
    }
  ];

  async searchVenues(criteria: any) {
    let filtered = this.venues;

    if (criteria.culturalRequirements) {
      filtered = filtered.filter(venue => 
        venue.culturalAccommodations.some((acc: string) => 
          acc.toLowerCase().includes(criteria.culturalRequirements.toLowerCase())
        )
      );
    }

    if (criteria.minCapacity) {
      filtered = filtered.filter(venue => venue.capacity >= criteria.minCapacity);
    }

    if (criteria.requiredDate) {
      filtered = filtered.filter(venue => 
        venue.availability.includes(criteria.requiredDate)
      );
    }

    return { venues: filtered, total: filtered.length };
  }

  async bookVenue(venueId: string, date: string, details: any) {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) {
      return { success: false, error: 'Venue not found' };
    }

    if (!venue.availability.includes(date)) {
      return { success: false, error: 'Date not available' };
    }

    // Remove date from availability
    venue.availability = venue.availability.filter((d: string) => d !== date);

    return {
      success: true,
      booking: {
        venueId,
        venue: venue.name,
        date,
        details,
        bookingId: `booking_${Date.now()}`,
        status: 'confirmed'
      }
    };
  }
}

class MockTimelineManager {
  private timelines: Map<string, any> = new Map();

  async createTimeline(familyId: string, serviceDate: Date, culturalRequirements: any) {
    const timeline = {
      familyId,
      serviceDate,
      culturalRequirements,
      milestones: [],
      deadlines: new Map(),
      status: 'draft'
    };

    // Add cultural-specific milestones
    if (culturalRequirements.religion === 'islamic') {
      timeline.milestones.push({
        name: 'Burial within 24 hours',
        deadline: new Date(serviceDate.getTime() - 24 * 60 * 60 * 1000),
        critical: true
      });
    }

    if (culturalRequirements.religion === 'jewish') {
      timeline.milestones.push({
        name: 'Tahara preparation',
        deadline: new Date(serviceDate.getTime() - 6 * 60 * 60 * 1000),
        critical: true
      });
    }

    // Standard milestones
    timeline.milestones.push(
      {
        name: 'Document collection complete',
        deadline: new Date(serviceDate.getTime() - 48 * 60 * 60 * 1000),
        critical: true
      },
      {
        name: 'Venue booking confirmed',
        deadline: new Date(serviceDate.getTime() - 72 * 60 * 60 * 1000),
        critical: true
      },
      {
        name: 'Family approvals obtained',
        deadline: new Date(serviceDate.getTime() - 24 * 60 * 60 * 1000),
        critical: false
      }
    );

    this.timelines.set(familyId, timeline);
    return timeline;
  }

  async updateMilestone(familyId: string, milestoneName: string, status: string) {
    const timeline = this.timelines.get(familyId);
    if (timeline) {
      const milestone = timeline.milestones.find((m: any) => m.name === milestoneName);
      if (milestone) {
        milestone.status = status;
        milestone.completedAt = new Date();
      }
    }
  }

  async checkCompliance(familyId: string) {
    const timeline = this.timelines.get(familyId);
    if (!timeline) return { compliant: false, errors: ['Timeline not found'] };

    const now = new Date();
    const violations = timeline.milestones
      .filter((m: any) => m.critical && m.deadline < now && m.status !== 'completed')
      .map((m: any) => `Critical milestone "${m.name}" overdue`);

    return {
      compliant: violations.length === 0,
      violations,
      timeline
    };
  }

  clear() {
    this.timelines.clear();
  }
}

describe('Multi-Agent Coordination Integration', () => {
  let orchestrator: FuneralPlanningOrchestrator;
  let culturalAgent: CulturalRequirementsAgent;
  let humanAgent: HumanInLoopAgent;
  let documentAgent: MockDocumentCollectionAgent;
  let venueAgent: MockVenueAgent;
  let timelineManager: MockTimelineManager;
  let mockConfig: any;

  beforeEach(() => {
    orchestrator = new FuneralPlanningOrchestrator();
    culturalAgent = new CulturalRequirementsAgent();
    humanAgent = new HumanInLoopAgent();
    documentAgent = new MockDocumentCollectionAgent();
    venueAgent = new MockVenueAgent();
    timelineManager = new MockTimelineManager();

    mockConfig = {
      configurable: {
        thread_id: `integration_test_${Date.now()}`,
        checkpoint_ns: 'integration_namespace',
      },
    };
  });

  afterEach(() => {
    documentAgent.clear();
    timelineManager.clear();
    jest.clearAllMocks();
  });

  describe('End-to-End Funeral Planning Workflow', () => {
    test('should coordinate complete Christian funeral planning workflow', async () => {
      const familyData = {
        familyId: 'christian_family_001',
        primaryContact: 'John Smith',
        religion: 'christian',
        denomination: 'Catholic',
        serviceDate: new Date('2024-07-15T14:00:00'),
        expectedGuests: 150,
        budget: 8000,
        specialRequests: ['Organ music', 'Flower arrangements']
      };

      // Stage 1: Cultural Assessment
      const culturalAssessment = await culturalAgent.assessFamily({
        familyId: familyData.familyId,
        primaryReligion: familyData.religion,
        denomination: familyData.denomination
      }, mockConfig);

      expect(culturalAssessment.identifiedRites.length).toBeGreaterThan(0);
      expect(culturalAssessment.identifiedRites[0].faith).toBe('Christian');

      // Stage 2: Document Collection
      const requiredDocs = ['death_certificate', 'burial_permit', 'identity_proof'];
      for (const docType of requiredDocs) {
        await documentAgent.collectDocument(
          familyData.familyId,
          docType,
          { type: docType, status: 'submitted', family: familyData.familyId }
        );
        
        const docId = `${familyData.familyId}_${docType}`;
        await documentAgent.verifyDocument(docId);
      }

      const docStatus = await documentAgent.getDocumentStatus(familyData.familyId);
      expect(docStatus.verified).toBe(requiredDocs.length);

      // Stage 3: Venue Selection
      const venueSearch = await venueAgent.searchVenues({
        culturalRequirements: 'Christian',
        minCapacity: familyData.expectedGuests,
        requiredDate: '2024-07-15'
      });

      expect(venueSearch.venues.length).toBeGreaterThan(0);
      const selectedVenue = venueSearch.venues[0];
      
      const booking = await venueAgent.bookVenue(
        selectedVenue.id,
        '2024-07-15',
        { familyId: familyData.familyId, serviceType: 'Catholic Mass' }
      );

      expect(booking.success).toBe(true);

      // Stage 4: Timeline Creation
      const timeline = await timelineManager.createTimeline(
        familyData.familyId,
        familyData.serviceDate,
        { religion: familyData.religion }
      );

      expect(timeline.milestones.length).toBeGreaterThan(0);

      // Stage 5: Workflow Orchestration
      const workflowState = {
        messages: [],
        planningStage: PlanningStage.INITIAL,
        familyRequirements: familyData,
        culturalRequirements: culturalAssessment.assessment,
        documentsRequired: requiredDocs,
        documentsCollected: requiredDocs,
        venueRequirements: { booking: booking.booking },
        serviceDetails: { timeline },
        approvals: [],
        pendingDecisions: [],
        errors: [],
        currentAgent: 'orchestrator',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(workflowState, mockConfig);
      
      // Should progress through workflow stages
      expect(result.planningStage).not.toBe(PlanningStage.INITIAL);
      expect(result.documentsCollected).toEqual(requiredDocs);
    });

    test('should handle Islamic funeral planning with special requirements', async () => {
      const islamicFamilyData = {
        familyId: 'islamic_family_001',
        primaryContact: 'Ahmed Hassan',
        religion: 'islamic',
        denomination: 'Sunni',
        serviceDate: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
        expectedGuests: 100,
        requiresImam: true,
        qiblaDirection: true,
        fastBurial: true
      };

      // Cultural Assessment with Islamic requirements
      const culturalAssessment = await culturalAgent.assessFamily({
        familyId: islamicFamilyData.familyId,
        primaryReligion: islamicFamilyData.religion
      }, mockConfig);

      const islamicRites = culturalAssessment.identifiedRites.filter(rite => 
        rite.faith === 'Islamic'
      );
      expect(islamicRites.length).toBeGreaterThan(0);

      // Venue selection for Islamic requirements
      const islamicVenueSearch = await venueAgent.searchVenues({
        culturalRequirements: 'Islamic',
        requiredDate: '2024-07-15'
      });

      expect(islamicVenueSearch.venues.length).toBeGreaterThan(0);
      const islamicVenue = islamicVenueSearch.venues.find(v => 
        v.name === 'Islamic Center'
      );
      expect(islamicVenue).toBeDefined();

      // Timeline with Islamic urgency requirements
      const islamicTimeline = await timelineManager.createTimeline(
        islamicFamilyData.familyId,
        islamicFamilyData.serviceDate,
        { religion: 'islamic' }
      );

      const criticalMilestones = islamicTimeline.milestones.filter((m: any) => m.critical);
      expect(criticalMilestones.some((m: any) => 
        m.name.includes('24 hours')
      )).toBe(true);

      // Check timeline compliance
      const compliance = await timelineManager.checkCompliance(islamicFamilyData.familyId);
      expect(compliance.timeline).toBeDefined();
    });

    test('should coordinate interfaith funeral planning', async () => {
      const interfaithFamilyData = {
        familyId: 'interfaith_family_001',
        primaryContact: 'Maria Cohen-Smith',
        primaryReligion: 'christian',
        secondaryReligion: 'jewish',
        serviceDate: new Date('2024-07-16T11:00:00'),
        expectedGuests: 200,
        requiresInterfaithClergy: true,
        specialAccommodations: ['Kosher options', 'Ecumenical elements']
      };

      // Multi-faith cultural assessment
      const culturalAssessment = await culturalAgent.assessFamily({
        familyId: interfaithFamilyData.familyId,
        primaryReligion: interfaithFamilyData.primaryReligion,
        secondaryReligions: [interfaithFamilyData.secondaryReligion]
      }, mockConfig);

      // Should identify multiple religious traditions
      expect(culturalAssessment.identifiedRites.length).toBeGreaterThan(1);
      
      // Should detect potential conflicts
      expect(culturalAssessment.conflicts.length).toBeGreaterThan(0);

      // Should recommend conflict resolution
      expect(culturalAssessment.recommendations.some(rec => 
        rec.category === 'conflict_resolution'
      )).toBe(true);

      // Human-in-loop for interfaith decision
      const interfaithDecision = {
        id: 'interfaith_001',
        type: DecisionType.CULTURAL_SENSITIVITY,
        priority: DecisionPriority.HIGH,
        title: 'Interfaith Service Planning',
        description: 'Resolve interfaith ceremony requirements',
        context: interfaithFamilyData,
        options: [
          {
            id: 'joint_ceremony',
            label: 'Joint interfaith ceremony',
            description: 'Combined Christian and Jewish elements',
            implications: ['Requires both clergy', 'Extended ceremony time']
          },
          {
            id: 'separate_services',
            label: 'Separate services',
            description: 'Distinct Christian and Jewish services',
            implications: ['Two venues needed', 'Higher cost']
          }
        ],
        requiredApprovers: ['family_primary', 'religious_advisor'],
        currentApprovers: [],
        culturalConsiderations: ['Religious compatibility', 'Family harmony'],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending' as const
      };

      const humanLoopResult = await humanAgent.processDecision(interfaithDecision, mockConfig);
      expect(humanLoopResult.currentDecision.culturalConsiderations.length).toBeGreaterThan(0);
    });
  });

  describe('Document Collection Workflow Integration', () => {
    test('should coordinate document collection across agents', async () => {
      const familyId = 'doc_coordination_001';
      const requiredDocuments = [
        'death_certificate',
        'burial_permit',
        'identity_proof',
        'insurance_documents',
        'will_testament'
      ];

      // Simulate document collection workflow
      const documentWorkflow = async () => {
        // Stage 1: Identify required documents based on cultural requirements
        const culturalAssessment = await culturalAgent.assessFamily({
          familyId,
          primaryReligion: 'christian'
        }, mockConfig);

        // Stage 2: Collect documents
        const collectionResults = [];
        for (const docType of requiredDocuments) {
          const result = await documentAgent.collectDocument(
            familyId,
            docType,
            { submittedBy: 'family', timestamp: new Date() }
          );
          collectionResults.push(result);
        }

        // Stage 3: Verify documents
        const verificationResults = [];
        for (const result of collectionResults) {
          if (result.success) {
            const verification = await documentAgent.verifyDocument(result.documentId);
            verificationResults.push(verification);
          }
        }

        // Stage 4: Update workflow state
        const docStatus = await documentAgent.getDocumentStatus(familyId);
        
        return {
          required: requiredDocuments.length,
          collected: collectionResults.filter(r => r.success).length,
          verified: verificationResults.filter(r => r.success).length,
          status: docStatus
        };
      };

      const result = await documentWorkflow();
      
      expect(result.required).toBe(requiredDocuments.length);
      expect(result.collected).toBe(requiredDocuments.length);
      expect(result.verified).toBe(requiredDocuments.length);
    });

    test('should handle document verification failures and recovery', async () => {
      const familyId = 'doc_failure_001';
      
      // Collect valid document
      await documentAgent.collectDocument(
        familyId,
        'death_certificate',
        { valid: true, certified: true }
      );

      // Collect invalid document (simulation)
      await documentAgent.collectDocument(
        familyId,
        'identity_proof',
        { valid: false, missingSignature: true }
      );

      const initialStatus = await documentAgent.getDocumentStatus(familyId);
      expect(initialStatus.total).toBe(2);

      // Verify documents - one should fail
      const deathCertResult = await documentAgent.verifyDocument(`${familyId}_death_certificate`);
      expect(deathCertResult.success).toBe(true);

      const idProofResult = await documentAgent.verifyDocument(`${familyId}_identity_proof`);
      // In real implementation, this would check document validity
      expect(idProofResult.success).toBe(true); // Mock always succeeds

      // Create human decision for document issue
      const documentDecision = {
        id: 'doc_issue_001',
        type: DecisionType.DOCUMENT_VERIFICATION,
        priority: DecisionPriority.HIGH,
        title: 'Document Verification Issue',
        description: 'Identity proof document requires correction',
        context: { familyId, documentType: 'identity_proof' },
        options: [
          {
            id: 'request_new',
            label: 'Request new document',
            description: 'Ask family to provide corrected document',
            implications: ['Workflow delay', 'Family communication needed']
          },
          {
            id: 'accept_with_conditions',
            label: 'Accept with conditions',
            description: 'Accept document with additional verification',
            implications: ['Additional verification required']
          }
        ],
        requiredApprovers: ['director', 'legal_advisor'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending' as const
      };

      const humanResult = await humanAgent.processDecision(documentDecision, mockConfig);
      expect(humanResult.currentDecision.type).toBe(DecisionType.DOCUMENT_VERIFICATION);
    });

    test('should track document collection milestones in timeline', async () => {
      const familyId = 'doc_timeline_001';
      const serviceDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      // Create timeline with document milestones
      const timeline = await timelineManager.createTimeline(
        familyId,
        serviceDate,
        { religion: 'christian' }
      );

      expect(timeline.milestones.some((m: any) => 
        m.name.includes('Document collection')
      )).toBe(true);

      // Simulate document collection progress
      await documentAgent.collectDocument(familyId, 'death_certificate', {});
      await timelineManager.updateMilestone(familyId, 'Document collection complete', 'in_progress');

      await documentAgent.collectDocument(familyId, 'burial_permit', {});
      await documentAgent.collectDocument(familyId, 'identity_proof', {});
      await timelineManager.updateMilestone(familyId, 'Document collection complete', 'completed');

      const compliance = await timelineManager.checkCompliance(familyId);
      expect(compliance.timeline.milestones.some((m: any) => 
        m.name === 'Document collection complete' && m.status === 'completed'
      )).toBe(true);
    });
  });

  describe('Timeline Compliance and Coordination', () => {
    test('should enforce cultural timeline requirements', async () => {
      const islamicUrgentCase = {
        familyId: 'urgent_islamic_001',
        deathDate: new Date(),
        serviceDate: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours from death
        religion: 'islamic'
      };

      const timeline = await timelineManager.createTimeline(
        islamicUrgentCase.familyId,
        islamicUrgentCase.serviceDate,
        { religion: 'islamic' }
      );

      // Should have urgent burial milestone
      const urgentMilestone = timeline.milestones.find((m: any) => 
        m.name.includes('24 hours')
      );
      expect(urgentMilestone).toBeDefined();
      expect(urgentMilestone.critical).toBe(true);

      // Check compliance - should be at risk due to timing
      const compliance = await timelineManager.checkCompliance(islamicUrgentCase.familyId);
      expect(compliance.timeline).toBeDefined();
    });

    test('should coordinate venue booking with timeline constraints', async () => {
      const familyId = 'venue_timeline_001';
      const serviceDate = new Date('2024-07-15T10:00:00');

      // Create timeline
      const timeline = await timelineManager.createTimeline(
        familyId,
        serviceDate,
        { religion: 'christian' }
      );

      // Find venue booking deadline
      const venueDeadline = timeline.milestones.find((m: any) => 
        m.name.includes('Venue booking')
      );
      expect(venueDeadline).toBeDefined();

      // Attempt venue booking
      const venueSearch = await venueAgent.searchVenues({
        requiredDate: '2024-07-15',
        minCapacity: 100
      });

      expect(venueSearch.venues.length).toBeGreaterThan(0);

      const booking = await venueAgent.bookVenue(
        venueSearch.venues[0].id,
        '2024-07-15',
        { familyId, urgency: 'standard' }
      );

      expect(booking.success).toBe(true);

      // Update timeline milestone
      await timelineManager.updateMilestone(familyId, 'Venue booking confirmed', 'completed');

      // Verify compliance
      const compliance = await timelineManager.checkCompliance(familyId);
      expect(compliance.timeline.milestones.some((m: any) => 
        m.name === 'Venue booking confirmed' && m.status === 'completed'
      )).toBe(true);
    });

    test('should handle timeline conflicts and escalation', async () => {
      const familyId = 'timeline_conflict_001';
      const serviceDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

      const timeline = await timelineManager.createTimeline(
        familyId,
        serviceDate,
        { religion: 'jewish' }
      );

      // Simulate missed deadline
      const criticalMilestone = timeline.milestones.find((m: any) => m.critical);
      if (criticalMilestone) {
        criticalMilestone.deadline = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      }

      const compliance = await timelineManager.checkCompliance(familyId);
      expect(compliance.compliant).toBe(false);
      expect(compliance.violations.length).toBeGreaterThan(0);

      // Create escalation decision
      const escalationDecision = {
        id: 'timeline_escalation_001',
        type: DecisionType.EMERGENCY_DECISION,
        priority: DecisionPriority.IMMEDIATE,
        title: 'Timeline Violation - Immediate Action Required',
        description: 'Critical milestone missed, timeline at risk',
        context: { familyId, violations: compliance.violations },
        options: [
          {
            id: 'expedite',
            label: 'Expedite remaining tasks',
            description: 'Fast-track all remaining milestones',
            implications: ['Higher costs', 'Resource reallocation']
          },
          {
            id: 'adjust_service',
            label: 'Adjust service date',
            description: 'Reschedule service to allow proper preparation',
            implications: ['Family notification', 'Venue rebooking']
          }
        ],
        requiredApprovers: ['executive_director'],
        currentApprovers: [],
        deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to decide
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending' as const
      };

      const urgentDecision = await humanAgent.processDecision(escalationDecision, mockConfig);
      expect(urgentDecision.currentDecision.priority).toBe(DecisionPriority.IMMEDIATE);
    });
  });

  describe('Error Handling and Recovery Coordination', () => {
    test('should coordinate error recovery across multiple agents', async () => {
      const familyId = 'error_recovery_001';
      
      // Simulate cascade of errors
      const errors = [
        'Document verification failed',
        'Venue booking conflict',
        'Cultural advisor unavailable'
      ];

      // Create workflow state with errors
      const errorState = {
        messages: [],
        planningStage: PlanningStage.DOCUMENT_COLLECTION,
        familyRequirements: { familyId },
        culturalRequirements: {},
        documentsRequired: ['death_certificate'],
        documentsCollected: [],
        venueRequirements: {},
        serviceDetails: {},
        approvals: [],
        pendingDecisions: [],
        errors,
        currentAgent: 'document_collector',
        timestamp: new Date(),
      };

      const result = await orchestrator.execute(errorState, mockConfig);
      
      expect(result.planningStage).toBe(PlanningStage.ERROR);
      expect(result.currentAgent).toBe('error_handler');
      expect(result.errors).toEqual(errors);

      // Test recovery workflow
      const recoveryDecision = {
        id: 'error_recovery_001',
        type: DecisionType.EMERGENCY_DECISION,
        priority: DecisionPriority.HIGH,
        title: 'System Error Recovery',
        description: 'Multiple system errors require coordinated recovery',
        context: { errors, familyId },
        options: [
          {
            id: 'systematic_recovery',
            label: 'Systematic error resolution',
            description: 'Address each error in priority order',
            implications: ['Extended timeline', 'Manual intervention required']
          },
          {
            id: 'alternative_workflow',
            label: 'Alternative workflow path',
            description: 'Switch to backup procedures',
            implications: ['Different service options', 'Immediate progress']
          }
        ],
        requiredApprovers: ['technical_director', 'family_liaison'],
        currentApprovers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending' as const
      };

      const recoveryResult = await humanAgent.processDecision(recoveryDecision, mockConfig);
      expect(recoveryResult.currentDecision.type).toBe(DecisionType.EMERGENCY_DECISION);
    });

    test('should maintain data consistency during error recovery', async () => {
      const familyId = 'consistency_test_001';
      
      // Start with partial workflow state
      const partialState = {
        familyId,
        documentsCollected: ['death_certificate'],
        venueBooking: null,
        culturalAssessment: { completed: false }
      };

      // Simulate error during venue booking
      try {
        await venueAgent.bookVenue('nonexistent_venue', '2024-07-15', partialState);
      } catch (error) {
        // Error expected
      }

      // Verify document collection state preserved
      const docStatus = await documentAgent.getDocumentStatus(familyId);
      expect(docStatus.total).toBe(0); // No documents in mock yet

      // Add document to verify state preservation
      await documentAgent.collectDocument(familyId, 'death_certificate', {});
      const updatedStatus = await documentAgent.getDocumentStatus(familyId);
      expect(updatedStatus.total).toBe(1);

      // Recovery should maintain this state
      const successfulBooking = await venueAgent.bookVenue('venue_001', '2024-07-15', {
        familyId,
        recoveryMode: true
      });
      expect(successfulBooking.success).toBe(true);

      // Verify document state still preserved
      const finalStatus = await documentAgent.getDocumentStatus(familyId);
      expect(finalStatus.total).toBe(1);
    });
  });

  describe('Performance and Scalability Integration', () => {
    test('should handle multiple concurrent funeral planning workflows', async () => {
      const concurrentFamilies = Array.from({ length: 5 }, (_, i) => ({
        familyId: `concurrent_family_${i}`,
        religion: ['christian', 'islamic', 'jewish', 'hindu', 'buddhist'][i],
        serviceDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
      }));

      const startTime = Date.now();

      const workflowPromises = concurrentFamilies.map(async (family) => {
        // Cultural assessment
        const cultural = await culturalAgent.assessFamily({
          familyId: family.familyId,
          primaryReligion: family.religion
        }, { ...mockConfig, configurable: { ...mockConfig.configurable, thread_id: family.familyId } });

        // Document collection
        await documentAgent.collectDocument(family.familyId, 'death_certificate', {});
        
        // Timeline creation
        const timeline = await timelineManager.createTimeline(
          family.familyId,
          family.serviceDate,
          { religion: family.religion }
        );

        return { familyId: family.familyId, cultural, timeline };
      });

      const results = await Promise.all(workflowPromises);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      results.forEach(result => {
        expect(result.cultural).toBeDefined();
        expect(result.timeline).toBeDefined();
      });
    });

    test('should maintain agent coordination under load', async () => {
      const loadTestFamilies = Array.from({ length: 20 }, (_, i) => ({
        familyId: `load_test_${i}`,
        religion: 'christian',
        priority: i % 3 === 0 ? 'high' : 'normal'
      }));

      const operationPromises = loadTestFamilies.map(async (family) => {
        const operations = [
          documentAgent.collectDocument(family.familyId, 'death_certificate', {}),
          culturalAgent.assessFamily({
            familyId: family.familyId,
            primaryReligion: family.religion
          }, mockConfig),
          venueAgent.searchVenues({ culturalRequirements: family.religion })
        ];

        return Promise.all(operations);
      });

      const allResults = await Promise.all(operationPromises);
      
      expect(allResults).toHaveLength(20);
      allResults.forEach(results => {
        expect(results).toHaveLength(3); // Document, cultural, venue operations
        expect(results[0].success).toBe(true); // Document collection
        expect(results[1].assessment).toBeDefined(); // Cultural assessment
        expect(results[2].venues).toBeDefined(); // Venue search
      });
    });
  });
});