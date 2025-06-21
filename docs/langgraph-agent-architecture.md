# LangGraph JS Agent Architecture
## Human-in-the-Loop Funeral Planning Workflows for Dutch Market

**Why**: Complex funeral planning requires AI assistance with human oversight for cultural sensitivity  
**What**: LangGraph JS agents orchestrating funeral workflows with interrupt-based human approval  
**How**: State-based workflows with checkpointing, cultural awareness, and regulatory compliance  

## Core Architecture Overview

### 1. Agent Workflow Orchestration
```typescript
// lib/agents/types.ts
import { Annotation, StateGraph, interrupt, Command } from "@langchain/langgraph";

// Core state interface for all funeral planning workflows
export const FuneralPlanningState = Annotation.Root({
  // Case identification
  caseId: Annotation<string>(),
  familyId: Annotation<string>(),
  
  // Deceased information
  deceasedInfo: Annotation<{
    name: string;
    dateOfDeath: string;
    dateOfBirth?: string;
    nationality: string;
    religion?: string;
    relationships: Array<{
      name: string;
      relation: string;
      contact: string;
      isPrimaryContact: boolean;
    }>;
  }>(),
  
  // Service preferences
  servicePreferences: Annotation<{
    type: "burial" | "cremation" | "memorial" | "direct_cremation";
    location?: string;
    estimatedAttendance: number;
    culturalRequirements: string[];
    specialRequests: string[];
    budget: {
      min: number;
      max: number;
      paymentTier: "standard" | "gemeente" | "premium";
    };
  }>(),
  
  // Timeline and compliance
  timeline: Annotation<{
    deathDate: string;
    registrationDeadline: string; // 5 days from death
    funeralDeadline: string; // 6 working days from death
    currentStatus: "on_track" | "urgent" | "at_risk" | "compliant";
  }>(),
  
  // Stakeholder information
  stakeholders: Annotation<{
    assignedDirector?: {
      id: string;
      name: string;
      specializations: string[];
    };
    selectedVenues: Array<{
      id: string;
      name: string;
      bookingSlots: string[];
    }>;
    municipality: {
      name: string;
      requirements: string[];
    };
  }>(),
  
  // Workflow control
  pendingApprovals: Annotation<Array<{
    type: string;
    description: string;
    requiredRole: "family" | "director" | "venue";
    priority: "low" | "medium" | "high" | "urgent";
    deadline?: string;
  }>>(),
  
  // Message history for context
  messages: Annotation<any[]>(),
  
  // Workflow metadata
  workflowVersion: Annotation<string>(),
  lastUpdated: Annotation<string>(),
  currentPhase: Annotation<"intake" | "planning" | "booking" | "coordination" | "completed">()
});

export type FuneralPlanningStateType = typeof FuneralPlanningState.State;
```

### 2. Master Funeral Planning Workflow

#### Core Workflow Graph
```typescript
// lib/agents/workflows/funeral-planning.ts
import { StateGraph, Command, interrupt } from "@langchain/langgraph";
import { FuneralPlanningState, FuneralPlanningStateType } from "../types";

export class FuneralPlanningWorkflow {
  private graph: StateGraph<FuneralPlanningStateType>;
  
  constructor() {
    this.graph = new StateGraph(FuneralPlanningState);
    this.buildWorkflow();
  }
  
  private buildWorkflow() {
    // Initial intake and information gathering
    this.graph.addNode("intake_assessment", this.intakeAssessment.bind(this));
    this.graph.addNode("cultural_sensitivity_check", this.culturalSensitivityCheck.bind(this));
    this.graph.addNode("timeline_compliance_check", this.timelineComplianceCheck.bind(this));
    
    // Planning phase nodes
    this.graph.addNode("service_design", this.serviceDesign.bind(this));
    this.graph.addNode("provider_matching", this.providerMatching.bind(this));
    this.graph.addNode("venue_selection", this.venueSelection.bind(this));
    
    // Human approval nodes
    this.graph.addNode("family_approval", this.familyApproval.bind(this));
    this.graph.addNode("director_coordination", this.directorCoordination.bind(this));
    this.graph.addNode("regulatory_verification", this.regulatoryVerification.bind(this));
    
    // Booking and coordination
    this.graph.addNode("booking_coordination", this.bookingCoordination.bind(this));
    this.graph.addNode("document_collection", this.documentCollection.bind(this));
    this.graph.addNode("communication_setup", this.communicationSetup.bind(this));
    
    // Final phases
    this.graph.addNode("final_confirmation", this.finalConfirmation.bind(this));
    this.graph.addNode("post_service_support", this.postServiceSupport.bind(this));
    
    // Error handling and escalation
    this.graph.addNode("escalation_handler", this.escalationHandler.bind(this));
    this.graph.addNode("compliance_alert", this.complianceAlert.bind(this));
    
    this.defineWorkflowEdges();
  }
  
  private defineWorkflowEdges() {
    // Start with intake
    this.graph.setEntryPoint("intake_assessment");
    
    // Intake flow
    this.graph.addEdge("intake_assessment", "cultural_sensitivity_check");
    this.graph.addEdge("cultural_sensitivity_check", "timeline_compliance_check");
    
    // Conditional routing from timeline check
    this.graph.addConditionalEdges(
      "timeline_compliance_check",
      this.routeAfterTimelineCheck.bind(this),
      {
        "continue": "service_design",
        "urgent": "compliance_alert",
        "incomplete": "intake_assessment"
      }
    );
    
    // Planning flow
    this.graph.addEdge("service_design", "provider_matching");
    this.graph.addEdge("provider_matching", "venue_selection");
    this.graph.addEdge("venue_selection", "family_approval");
    
    // Approval and coordination flow
    this.graph.addConditionalEdges(
      "family_approval",
      this.routeAfterFamilyApproval.bind(this),
      {
        "approved": "director_coordination",
        "needs_revision": "service_design",
        "escalate": "escalation_handler"
      }
    );
    
    this.graph.addEdge("director_coordination", "regulatory_verification");
    this.graph.addEdge("regulatory_verification", "booking_coordination");
    
    // Final coordination
    this.graph.addEdge("booking_coordination", "document_collection");
    this.graph.addEdge("document_collection", "communication_setup");
    this.graph.addEdge("communication_setup", "final_confirmation");
    this.graph.addEdge("final_confirmation", "post_service_support");
    
    // Error handling
    this.graph.addEdge("compliance_alert", "escalation_handler");
    this.graph.addEdge("escalation_handler", "director_coordination");
  }
  
  // Node implementations with human-in-the-loop patterns
  private async intakeAssessment(state: FuneralPlanningStateType): Promise<Partial<FuneralPlanningStateType>> {
    console.log(`Starting intake assessment for case ${state.caseId}`);
    
    // Gather initial information about the deceased and family
    const incompleteFields = this.validateRequiredInformation(state);
    
    if (incompleteFields.length > 0) {
      // Interrupt workflow for family to provide missing information
      const familyInput = interrupt({
        type: "information_request",
        message: "We need some additional information to help plan the funeral service.",
        missingFields: incompleteFields,
        urgency: this.calculateUrgency(state.timeline),
        context: {
          deceasedName: state.deceasedInfo.name,
          timelineStatus: state.timeline.currentStatus
        }
      });
      
      // Update state with provided information
      return {
        deceasedInfo: { ...state.deceasedInfo, ...familyInput.deceasedInfo },
        servicePreferences: { ...state.servicePreferences, ...familyInput.servicePreferences },
        currentPhase: "intake",
        lastUpdated: new Date().toISOString()
      };
    }
    
    return {
      currentPhase: "planning",
      lastUpdated: new Date().toISOString()
    };
  }
  
  private async culturalSensitivityCheck(state: FuneralPlanningStateType): Promise<Partial<FuneralPlanningStateType>> {
    const culturalRequirements = state.servicePreferences.culturalRequirements;
    const religion = state.deceasedInfo.religion;
    
    // Check if we have specific cultural or religious requirements
    if (culturalRequirements.length > 0 || (religion && religion !== "none")) {
      const culturalGuidance = await this.getCulturalGuidance(religion, culturalRequirements);
      
      // For complex cultural requirements, require human oversight
      if (culturalGuidance.requiresSpecialist) {
        const approval = interrupt({
          type: "cultural_verification",
          message: `This service involves ${religion} traditions and specific cultural requirements. Please review and confirm the arrangements are appropriate.`,
          requirements: culturalRequirements,
          guidance: culturalGuidance.recommendations,
          context: state.deceasedInfo
        });
        
        return {
          servicePreferences: {
            ...state.servicePreferences,
            culturalRequirements: approval.approvedRequirements,
            specialRequests: [
              ...state.servicePreferences.specialRequests,
              ...approval.additionalRequests
            ]
          },
          pendingApprovals: state.pendingApprovals.filter(a => a.type !== "cultural_verification")
        };
      }
    }
    
    return { lastUpdated: new Date().toISOString() };
  }
  
  private async timelineComplianceCheck(state: FuneralPlanningStateType): Promise<Partial<FuneralPlanningStateType>> {
    const now = new Date();
    const deathDate = new Date(state.timeline.deathDate);
    const registrationDeadline = new Date(state.timeline.registrationDeadline);
    const funeralDeadline = new Date(state.timeline.funeralDeadline);
    
    // Calculate days remaining for compliance
    const daysToRegistration = Math.ceil((registrationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysToFuneral = Math.ceil((funeralDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let timelineStatus: "on_track" | "urgent" | "at_risk" | "compliant" = "on_track";
    
    if (daysToFuneral <= 1) {
      timelineStatus = "urgent";
    } else if (daysToFuneral <= 2) {
      timelineStatus = "at_risk";
    } else if (daysToRegistration <= 1) {
      timelineStatus = "urgent";
    }
    
    // If timeline is critical, require immediate human intervention
    if (timelineStatus === "urgent") {
      const urgentApproval = interrupt({
        type: "urgent_timeline",
        message: `URGENT: Only ${daysToFuneral} days remaining until funeral deadline. Immediate action required.`,
        deadline: funeralDeadline.toISOString(),
        requiredActions: [
          "Confirm death registration status",
          "Secure burial/cremation permit",
          "Book venue immediately",
          "Notify all stakeholders"
        ],
        escalateToDirector: true
      });
      
      return {
        timeline: { ...state.timeline, currentStatus: timelineStatus },
        pendingApprovals: [
          ...state.pendingApprovals,
          {
            type: "urgent_timeline",
            description: "Urgent timeline approval required",
            requiredRole: "director" as const,
            priority: "urgent" as const,
            deadline: funeralDeadline.toISOString()
          }
        ]
      };
    }
    
    return {
      timeline: { ...state.timeline, currentStatus: timelineStatus },
      lastUpdated: new Date().toISOString()
    };
  }
  
  private async serviceDesign(state: FuneralPlanningStateType): Promise<Partial<FuneralPlanningStateType>> {
    const preferences = state.servicePreferences;
    const budget = preferences.budget;
    
    // Generate service design recommendations based on preferences and budget
    const serviceOptions = await this.generateServiceOptions(preferences, budget);
    
    // For budget-conscious families, provide cost-saving alternatives
    if (budget.paymentTier === "gemeente") {
      const gemeinteOptions = await this.filterGemeinteCompatibleOptions(serviceOptions);
      
      return {
        servicePreferences: {
          ...preferences,
          recommendedOptions: gemeinteOptions
        },
        pendingApprovals: [
          ...state.pendingApprovals,
          {
            type: "service_design",
            description: "Review gemeente-compatible service options",
            requiredRole: "family" as const,
            priority: "medium" as const
          }
        ]
      };
    }
    
    return {
      servicePreferences: {
        ...preferences,
        recommendedOptions: serviceOptions
      },
      currentPhase: "planning",
      lastUpdated: new Date().toISOString()
    };
  }
  
  private async familyApproval(state: FuneralPlanningStateType): Promise<Partial<FuneralPlanningStateType>> {
    // Present complete service plan for family approval
    const serviceplan = this.generateServicePlan(state);
    
    const approval = interrupt({
      type: "service_plan_approval",
      message: "Please review and approve the funeral service plan.",
      servicePlan: serviceplan,
      estimatedCost: this.calculateTotalCost(serviceplan),
      timeline: state.timeline,
      nextSteps: [
        "Confirm service details",
        "Approve venue booking",
        "Finalize guest list",
        "Review payment arrangements"
      ]
    });
    
    if (approval.approved) {
      return {
        servicePreferences: {
          ...state.servicePreferences,
          finalPlan: approval.modifiedPlan || serviceplan
        },
        pendingApprovals: state.pendingApprovals.filter(a => a.type !== "service_plan_approval")
      };
    }
    
    // If not approved, add revision requirements
    return {
      pendingApprovals: [
        ...state.pendingApprovals,
        {
          type: "plan_revision",
          description: approval.revisionReason,
          requiredRole: "family" as const,
          priority: "high" as const
        }
      ]
    };
  }
  
  // Routing functions for conditional edges
  private routeAfterTimelineCheck(state: FuneralPlanningStateType): string {
    if (state.timeline.currentStatus === "urgent") {
      return "urgent";
    } else if (!this.isIntakeComplete(state)) {
      return "incomplete";
    }
    return "continue";
  }
  
  private routeAfterFamilyApproval(state: FuneralPlanningStateType): string {
    const hasApprovalPending = state.pendingApprovals.some(a => a.type === "service_plan_approval");
    const hasRevisionNeeded = state.pendingApprovals.some(a => a.type === "plan_revision");
    
    if (hasRevisionNeeded) {
      return "needs_revision";
    } else if (!hasApprovalPending) {
      return "approved";
    }
    return "escalate";
  }
  
  // Helper methods
  private validateRequiredInformation(state: FuneralPlanningStateType): string[] {
    const missing: string[] = [];
    
    if (!state.deceasedInfo.name) missing.push("deceased_name");
    if (!state.deceasedInfo.dateOfDeath) missing.push("date_of_death");
    if (!state.servicePreferences.type) missing.push("service_type");
    if (!state.timeline.registrationDeadline) missing.push("municipality");
    
    return missing;
  }
  
  private calculateUrgency(timeline: any): "low" | "medium" | "high" | "urgent" {
    const now = new Date();
    const deadline = new Date(timeline.funeralDeadline);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 1) return "urgent";
    if (daysRemaining <= 2) return "high";
    if (daysRemaining <= 3) return "medium";
    return "low";
  }
  
  private async getCulturalGuidance(religion: string, requirements: string[]) {
    // This would integrate with cultural knowledge base
    return {
      requiresSpecialist: ["islamic", "jewish", "hindu"].includes(religion?.toLowerCase()),
      recommendations: [], // Would be populated with specific guidance
      specialistRequired: false
    };
  }
  
  private isIntakeComplete(state: FuneralPlanningStateType): boolean {
    return this.validateRequiredInformation(state).length === 0;
  }
  
  private generateServicePlan(state: FuneralPlanningStateType) {
    // Generate comprehensive service plan
    return {
      serviceType: state.servicePreferences.type,
      venue: state.stakeholders.selectedVenues[0],
      director: state.stakeholders.assignedDirector,
      timeline: state.timeline,
      culturalRequirements: state.servicePreferences.culturalRequirements,
      estimatedAttendance: state.servicePreferences.estimatedAttendance
    };
  }
  
  private calculateTotalCost(servicePlan: any): number {
    // Calculate total estimated cost
    return 0; // Would implement actual cost calculation
  }
  
  // Compile the workflow
  public compile() {
    return this.graph.compile({
      checkpointer: this.createCheckpointer(),
      interruptBefore: [
        "family_approval",
        "cultural_sensitivity_check",
        "regulatory_verification"
      ],
      interruptAfter: [
        "compliance_alert",
        "escalation_handler"
      ]
    });
  }
  
  private createCheckpointer() {
    // Redis-based checkpointing for production
    // or in-memory for development
    return process.env.NODE_ENV === "production"
      ? this.createRedisCheckpointer()
      : this.createMemoryCheckpointer();
  }
  
  private createRedisCheckpointer() {
    // Implementation for Redis checkpointing
    return null; // Placeholder
  }
  
  private createMemoryCheckpointer() {
    // Implementation for in-memory checkpointing
    return null; // Placeholder
  }
}
```

### 3. Specialized Agent Workflows

#### Document Collection Agent
```typescript
// lib/agents/workflows/document-collection.ts
export class DocumentCollectionWorkflow {
  private graph: StateGraph<DocumentCollectionState>;
  
  constructor() {
    this.graph = new StateGraph(DocumentCollectionState);
    this.buildDocumentWorkflow();
  }
  
  private buildDocumentWorkflow() {
    this.graph.addNode("assess_required_documents", this.assessRequiredDocuments.bind(this));
    this.graph.addNode("request_missing_documents", this.requestMissingDocuments.bind(this));
    this.graph.addNode("validate_documents", this.validateDocuments.bind(this));
    this.graph.addNode("secure_storage", this.secureStorage.bind(this));
    this.graph.addNode("distribution_setup", this.distributionSetup.bind(this));
    
    // Define workflow edges
    this.graph.setEntryPoint("assess_required_documents");
    this.graph.addEdge("assess_required_documents", "request_missing_documents");
    this.graph.addEdge("request_missing_documents", "validate_documents");
    this.graph.addEdge("validate_documents", "secure_storage");
    this.graph.addEdge("secure_storage", "distribution_setup");
  }
  
  private async assessRequiredDocuments(state: DocumentCollectionState): Promise<Partial<DocumentCollectionState>> {
    const serviceType = state.serviceType;
    const municipality = state.municipality;
    
    // Determine required documents based on Dutch regulations
    const requiredDocs = this.getDutchRequiredDocuments(serviceType, municipality);
    
    return {
      requiredDocuments: requiredDocs,
      documentStatus: "assessment_complete"
    };
  }
  
  private async requestMissingDocuments(state: DocumentCollectionState): Promise<Partial<DocumentCollectionState>> {
    const missing = state.requiredDocuments.filter(doc => !state.providedDocuments.includes(doc.type));
    
    if (missing.length > 0) {
      const documentRequest = interrupt({
        type: "document_request",
        message: "We need the following documents to proceed with the funeral arrangements:",
        missingDocuments: missing.map(doc => ({
          type: doc.type,
          description: doc.description,
          urgency: doc.urgency,
          whereTo GetIt: doc.instructions
        })),
        deadline: state.complianceDeadline
      });
      
      return {
        providedDocuments: [...state.providedDocuments, ...documentRequest.uploadedDocuments]
      };
    }
    
    return { documentStatus: "all_provided" };
  }
  
  private getDutchRequiredDocuments(serviceType: string, municipality: string) {
    const baseDocuments = [
      {
        type: "death_certificate",
        description: "Overlijdensakte (Death Certificate)",
        urgency: "high",
        instructions: "Obtain from municipality where death occurred"
      },
      {
        type: "id_verification",
        description: "Identity verification of deceased",
        urgency: "medium",
        instructions: "Passport or ID card of deceased"
      }
    ];
    
    if (serviceType === "burial") {
      baseDocuments.push({
        type: "burial_permit",
        description: "Verlof tot begraven",
        urgency: "high",
        instructions: "Apply at municipality"
      });
    } else if (serviceType === "cremation") {
      baseDocuments.push({
        type: "cremation_permit",
        description: "Verlof tot cremeren",
        urgency: "high",
        instructions: "Apply at municipality"
      });
    }
    
    return baseDocuments;
  }
}
```

### 4. Workflow Management System

#### Workflow Orchestrator
```typescript
// lib/agents/orchestrator.ts
export class FuneralWorkflowOrchestrator {
  private workflows: Map<string, any> = new Map();
  private activeWorkflows: Map<string, string> = new Map(); // caseId -> workflowId
  
  constructor() {
    this.registerWorkflows();
  }
  
  private registerWorkflows() {
    this.workflows.set("funeral_planning", new FuneralPlanningWorkflow());
    this.workflows.set("document_collection", new DocumentCollectionWorkflow());
    this.workflows.set("payment_processing", new PaymentProcessingWorkflow());
    this.workflows.set("compliance_monitoring", new ComplianceMonitoringWorkflow());
  }
  
  public async startWorkflow(
    workflowType: string, 
    caseId: string, 
    initialState: any
  ): Promise<string> {
    const workflow = this.workflows.get(workflowType);
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }
    
    const workflowId = `${workflowType}_${caseId}_${Date.now()}`;
    
    // Start the workflow execution
    const compiledWorkflow = workflow.compile();
    const thread = { configurable: { thread_id: workflowId } };
    
    try {
      await compiledWorkflow.invoke(initialState, thread);
      this.activeWorkflows.set(caseId, workflowId);
      
      // Store workflow state in database
      await this.persistWorkflowState(workflowId, caseId, workflowType, initialState);
      
      return workflowId;
    } catch (error) {
      console.error(`Failed to start workflow ${workflowType} for case ${caseId}:`, error);
      throw error;
    }
  }
  
  public async resumeWorkflow(
    caseId: string, 
    interruptResponse: any
  ): Promise<void> {
    const workflowId = this.activeWorkflows.get(caseId);
    if (!workflowId) {
      throw new Error(`No active workflow found for case ${caseId}`);
    }
    
    const [workflowType] = workflowId.split('_');
    const workflow = this.workflows.get(workflowType);
    const compiledWorkflow = workflow.compile();
    
    const thread = { configurable: { thread_id: workflowId } };
    
    try {
      // Resume with the interrupt response
      await compiledWorkflow.invoke(interruptResponse, thread);
      
      // Update workflow state
      await this.updateWorkflowState(workflowId, interruptResponse);
    } catch (error) {
      console.error(`Failed to resume workflow ${workflowId}:`, error);
      throw error;
    }
  }
  
  public async getWorkflowStatus(caseId: string): Promise<any> {
    const workflowId = this.activeWorkflows.get(caseId);
    if (!workflowId) {
      return { status: "no_active_workflow" };
    }
    
    return await this.getWorkflowState(workflowId);
  }
  
  private async persistWorkflowState(
    workflowId: string, 
    caseId: string, 
    workflowType: string, 
    state: any
  ): Promise<void> {
    // Store in workflow_states table
    await db.query(`
      INSERT INTO workflow_states (id, funeral_case_id, workflow_type, current_node, state_data)
      VALUES ($1, $2, $3, $4, $5)
    `, [workflowId, caseId, workflowType, state.currentPhase || "initial", state]);
  }
  
  private async updateWorkflowState(workflowId: string, state: any): Promise<void> {
    await db.query(`
      UPDATE workflow_states 
      SET state_data = $1, updated_at = NOW()
      WHERE id = $2
    `, [state, workflowId]);
  }
  
  private async getWorkflowState(workflowId: string): Promise<any> {
    const result = await db.query(`
      SELECT * FROM workflow_states WHERE id = $1
    `, [workflowId]);
    
    return result.rows[0] || null;
  }
}
```

### 5. Integration with API Endpoints

#### Workflow API Routes
```typescript
// app/api/workflows/[workflowType]/route.ts
import { FuneralWorkflowOrchestrator } from '@/lib/agents/orchestrator';

const orchestrator = new FuneralWorkflowOrchestrator();

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { caseId, initialState } = await req.json();
    const workflowType = req.url.split('/').slice(-2)[0];
    
    const workflowId = await orchestrator.startWorkflow(
      workflowType,
      caseId,
      initialState
    );
    
    return Response.json(createSuccessResponse({ workflowId }));
  } catch (error) {
    return Response.json(
      createErrorResponse('WORKFLOW_START_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family', 'director']);

// app/api/workflows/resume/route.ts
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { caseId, interruptResponse } = await req.json();
    
    await orchestrator.resumeWorkflow(caseId, interruptResponse);
    
    return Response.json(createSuccessResponse({ resumed: true }));
  } catch (error) {
    return Response.json(
      createErrorResponse('WORKFLOW_RESUME_ERROR', error.message),
      { status: 500 }
    );
  }
}, ['family', 'director']);
```

This LangGraph JS architecture provides a robust foundation for human-in-the-loop funeral planning workflows with proper state management, cultural sensitivity, regulatory compliance, and seamless integration with the Farewelly platform.