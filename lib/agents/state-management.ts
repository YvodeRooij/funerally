/**
 * State Management System for Funeral Planning Workflows
 * 
 * Comprehensive state management for complex funeral planning workflows,
 * including state persistence, validation, and transitions.
 */

import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// Core workflow state schemas
export const PersonSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  relationship: z.string(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  role: z.enum(["primary_contact", "secondary_contact", "decision_maker", "participant"]),
  culturalBackground: z.string().optional(),
  religiousAffiliation: z.string().optional(),
});

export const DeceasedPersonSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date(),
  dateOfDeath: z.date(),
  placeOfDeath: z.string(),
  culturalBackground: z.string().optional(),
  religiousAffiliation: z.string().optional(),
  specialRequirements: z.array(z.string()),
  medicalInformation: z.object({
    causeOfDeath: z.string().optional(),
    medicalExaminerCase: z.boolean(),
    organDonor: z.boolean(),
    autopsy: z.boolean(),
  }).optional(),
});

export const ServicePreferencesSchema = z.object({
  serviceType: z.enum(["burial", "cremation", "memorial", "celebration_of_life"]),
  serviceStyle: z.enum(["traditional", "contemporary", "religious", "secular", "mixed"]),
  location: z.object({
    type: z.enum(["funeral_home", "church", "outdoor", "home", "venue"]),
    specific: z.string().optional(),
    address: z.string().optional(),
  }),
  timing: z.object({
    preferredDate: z.date().optional(),
    preferredTime: z.string().optional(),
    flexibility: z.enum(["strict", "moderate", "flexible"]),
  }),
  capacity: z.object({
    expected: z.number(),
    maximum: z.number(),
  }),
  culturalElements: z.array(z.string()),
  religiousElements: z.array(z.string()),
  personalizations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
  })),
});

export const DocumentSchema = z.object({
  id: z.string(),
  type: z.enum([
    "death_certificate",
    "will",
    "insurance_policy",
    "burial_permit",
    "cremation_permit",
    "medical_examiner_release",
    "military_records",
    "personal_effects_inventory",
    "custom_document"
  ]),
  status: z.enum(["required", "pending", "submitted", "verified", "approved", "rejected"]),
  filename: z.string().optional(),
  uploadedAt: z.date().optional(),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().optional(),
  metadata: z.any().optional(),
  notes: z.string().optional(),
});

export const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["funeral_home", "church", "synagogue", "mosque", "temple", "community_center", "outdoor", "other"]),
  address: z.string(),
  capacity: z.number(),
  amenities: z.array(z.string()),
  availability: z.array(z.object({
    date: z.date(),
    timeSlots: z.array(z.string()),
  })),
  pricing: z.object({
    baseRate: z.number(),
    additionalServices: z.array(z.object({
      service: z.string(),
      cost: z.number(),
    })),
  }),
  culturalSuitability: z.array(z.string()),
  religiousSuitability: z.array(z.string()),
});

export const BudgetSchema = z.object({
  totalBudget: z.number().optional(),
  categories: z.array(z.object({
    category: z.string(),
    budgeted: z.number(),
    estimated: z.number(),
    actual: z.number().optional(),
    items: z.array(z.object({
      item: z.string(),
      cost: z.number(),
      required: z.boolean(),
    })),
  })),
  paymentMethod: z.enum(["cash", "credit", "insurance", "financing", "mixed"]).optional(),
  insuranceInfo: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    coverage: z.number(),
    verified: z.boolean(),
  }).optional(),
});

// Main workflow state
export const FuneralWorkflowStateSchema = z.object({
  // Basic identification
  workflowId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Workflow status
  currentStage: z.string(),
  completedStages: z.array(z.string()),
  availableStages: z.array(z.string()),
  
  // People involved
  deceasedPerson: DeceasedPersonSchema,
  familyMembers: z.array(PersonSchema),
  contacts: z.array(PersonSchema),
  serviceProviders: z.array(z.object({
    type: z.string(),
    provider: PersonSchema,
    services: z.array(z.string()),
    status: z.string(),
  })),
  
  // Service details
  servicePreferences: ServicePreferencesSchema,
  finalizedService: ServicePreferencesSchema.optional(),
  
  // Documents
  documents: z.array(DocumentSchema),
  
  // Venue information
  venues: z.array(VenueSchema),
  selectedVenue: VenueSchema.optional(),
  
  // Financial information
  budget: BudgetSchema,
  
  // Cultural and religious requirements
  culturalRequirements: z.array(z.object({
    type: z.string(),
    description: z.string(),
    mandatory: z.boolean(),
    fulfilled: z.boolean(),
  })),
  religiousRequirements: z.array(z.object({
    type: z.string(),
    description: z.string(),
    mandatory: z.boolean(),
    fulfilled: z.boolean(),
  })),
  
  // Workflow metadata
  decisions: z.array(z.any()),
  approvals: z.array(z.object({
    type: z.string(),
    approver: z.string(),
    approved: z.boolean(),
    timestamp: z.date(),
    notes: z.string().optional(),
  })),
  notifications: z.array(z.object({
    id: z.string(),
    type: z.string(),
    recipient: z.string(),
    message: z.string(),
    sent: z.boolean(),
    sentAt: z.date().optional(),
  })),
  
  // Error and issue tracking
  issues: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["open", "in_progress", "resolved", "closed"]),
    createdAt: z.date(),
    resolvedAt: z.date().optional(),
  })),
  
  // Workflow configuration
  config: z.object({
    autoProgressEnabled: z.boolean(),
    notificationsEnabled: z.boolean(),
    culturalSensitivityLevel: z.enum(["standard", "high", "maximum"]),
    approvalRequirements: z.array(z.string()),
  }),
});

export type FuneralWorkflowState = z.infer<typeof FuneralWorkflowStateSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type DeceasedPerson = z.infer<typeof DeceasedPersonSchema>;
export type ServicePreferences = z.infer<typeof ServicePreferencesSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type Budget = z.infer<typeof BudgetSchema>;

// LangGraph state annotation
export const WorkflowStateAnnotation = Annotation.Root({
  workflowState: Annotation<FuneralWorkflowState>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({} as FuneralWorkflowState),
  }),
  lastUpdate: Annotation<Date>({
    reducer: (x, y) => y ?? x,
    default: () => new Date(),
  }),
  stateVersion: Annotation<number>({
    reducer: (x, y) => y ?? x + 1,
    default: () => 1,
  }),
});

/**
 * State Manager Class
 */
export class FuneralWorkflowStateManager {
  private currentState: FuneralWorkflowState | null = null;
  private stateHistory: FuneralWorkflowState[] = [];
  private validators: Map<string, (state: any) => boolean> = new Map();

  constructor() {
    this.initializeValidators();
  }

  /**
   * Initialize state validators
   */
  private initializeValidators() {
    this.validators.set("deceased_person", (state) => {
      return !!state.deceasedPerson?.firstName && !!state.deceasedPerson?.lastName;
    });

    this.validators.set("family_contacts", (state) => {
      return state.familyMembers?.length > 0 && 
             state.familyMembers.some((member: Person) => member.role === "primary_contact");
    });

    this.validators.set("service_preferences", (state) => {
      return !!state.servicePreferences?.serviceType;
    });

    this.validators.set("required_documents", (state) => {
      const requiredDocs = state.documents?.filter((doc: Document) => doc.status === "required");
      const submittedDocs = state.documents?.filter((doc: Document) => 
        doc.status === "submitted" || doc.status === "verified" || doc.status === "approved");
      return requiredDocs?.length === 0 || submittedDocs?.length >= requiredDocs?.length;
    });

    this.validators.set("venue_selected", (state) => {
      return !!state.selectedVenue;
    });

    this.validators.set("budget_approved", (state) => {
      return state.approvals?.some((approval: any) => 
        approval.type === "budget" && approval.approved);
    });
  }

  /**
   * Create new workflow state
   */
  public createWorkflowState(initialData: Partial<FuneralWorkflowState>): FuneralWorkflowState {
    const workflowId = `funeral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const defaultState: FuneralWorkflowState = {
      workflowId,
      createdAt: now,
      updatedAt: now,
      currentStage: "initial",
      completedStages: [],
      availableStages: ["requirements_gathering"],
      deceasedPerson: {} as DeceasedPerson,
      familyMembers: [],
      contacts: [],
      serviceProviders: [],
      servicePreferences: {} as ServicePreferences,
      documents: [],
      venues: [],
      budget: {
        categories: [],
      },
      culturalRequirements: [],
      religiousRequirements: [],
      decisions: [],
      approvals: [],
      notifications: [],
      issues: [],
      config: {
        autoProgressEnabled: true,
        notificationsEnabled: true,
        culturalSensitivityLevel: "high",
        approvalRequirements: ["family", "director"],
      },
      ...initialData,
    };

    // Validate the state
    const validation = FuneralWorkflowStateSchema.safeParse(defaultState);
    if (!validation.success) {
      throw new Error(`Invalid workflow state: ${validation.error.message}`);
    }

    this.currentState = validation.data;
    this.stateHistory.push(validation.data);
    return validation.data;
  }

  /**
   * Update workflow state
   */
  public updateState(updates: Partial<FuneralWorkflowState>): FuneralWorkflowState {
    if (!this.currentState) {
      throw new Error("No current state to update");
    }

    const updatedState: FuneralWorkflowState = {
      ...this.currentState,
      ...updates,
      updatedAt: new Date(),
    };

    // Validate the updated state
    const validation = FuneralWorkflowStateSchema.safeParse(updatedState);
    if (!validation.success) {
      throw new Error(`Invalid state update: ${validation.error.message}`);
    }

    this.currentState = validation.data;
    this.stateHistory.push(validation.data);
    return validation.data;
  }

  /**
   * Validate stage completion
   */
  public validateStageCompletion(stage: string): boolean {
    if (!this.currentState) return false;

    const validator = this.validators.get(stage);
    if (!validator) {
      console.warn(`No validator found for stage: ${stage}`);
      return true; // Allow progression if no validator is defined
    }

    return validator(this.currentState);
  }

  /**
   * Progress to next stage
   */
  public progressToStage(nextStage: string): FuneralWorkflowState {
    if (!this.currentState) {
      throw new Error("No current state to progress");
    }

    // Validate current stage completion
    if (!this.validateStageCompletion(this.currentState.currentStage)) {
      throw new Error(`Current stage ${this.currentState.currentStage} is not complete`);
    }

    const updatedState = this.updateState({
      currentStage: nextStage,
      completedStages: [...this.currentState.completedStages, this.currentState.currentStage],
      availableStages: this.getNextAvailableStages(nextStage),
    });

    return updatedState;
  }

  /**
   * Get next available stages based on current stage
   */
  private getNextAvailableStages(currentStage: string): string[] {
    const stageFlow = {
      "initial": ["requirements_gathering"],
      "requirements_gathering": ["cultural_assessment"],
      "cultural_assessment": ["document_collection"],
      "document_collection": ["venue_selection"],
      "venue_selection": ["service_planning"],
      "service_planning": ["approval_process"],
      "approval_process": ["coordination"],
      "coordination": ["execution"],
      "execution": ["completed"],
      "completed": [],
    };

    return stageFlow[currentStage as keyof typeof stageFlow] || [];
  }

  /**
   * Add document to workflow
   */
  public addDocument(document: Omit<Document, "id">): Document {
    if (!this.currentState) {
      throw new Error("No current state to add document to");
    }

    const newDocument: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...document,
    };

    this.updateState({
      documents: [...this.currentState.documents, newDocument],
    });

    return newDocument;
  }

  /**
   * Update document status
   */
  public updateDocumentStatus(documentId: string, status: Document["status"], metadata?: any): void {
    if (!this.currentState) {
      throw new Error("No current state to update document in");
    }

    const updatedDocuments = this.currentState.documents.map(doc =>
      doc.id === documentId
        ? { ...doc, status, metadata: { ...doc.metadata, ...metadata }, updatedAt: new Date() }
        : doc
    );

    this.updateState({ documents: updatedDocuments });
  }

  /**
   * Add family member
   */
  public addFamilyMember(person: Omit<Person, "id">): Person {
    if (!this.currentState) {
      throw new Error("No current state to add family member to");
    }

    const newPerson: Person = {
      id: `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...person,
    };

    this.updateState({
      familyMembers: [...this.currentState.familyMembers, newPerson],
    });

    return newPerson;
  }

  /**
   * Add cultural requirement
   */
  public addCulturalRequirement(requirement: {
    type: string;
    description: string;
    mandatory: boolean;
  }): void {
    if (!this.currentState) return;

    const culturalRequirement = {
      ...requirement,
      fulfilled: false,
    };

    this.updateState({
      culturalRequirements: [...this.currentState.culturalRequirements, culturalRequirement],
    });
  }

  /**
   * Add religious requirement
   */
  public addReligiousRequirement(requirement: {
    type: string;
    description: string;
    mandatory: boolean;
  }): void {
    if (!this.currentState) return;

    const religiousRequirement = {
      ...requirement,
      fulfilled: false,
    };

    this.updateState({
      religiousRequirements: [...this.currentState.religiousRequirements, religiousRequirement],
    });
  }

  /**
   * Add approval
   */
  public addApproval(approval: {
    type: string;
    approver: string;
    approved: boolean;
    notes?: string;
  }): void {
    if (!this.currentState) return;

    const newApproval = {
      ...approval,
      timestamp: new Date(),
    };

    this.updateState({
      approvals: [...this.currentState.approvals, newApproval],
    });
  }

  /**
   * Get current state
   */
  public getCurrentState(): FuneralWorkflowState | null {
    return this.currentState;
  }

  /**
   * Get state history
   */
  public getStateHistory(): FuneralWorkflowState[] {
    return [...this.stateHistory];
  }

  /**
   * Restore state from history
   */
  public restoreState(version: number): FuneralWorkflowState | null {
    if (version < 0 || version >= this.stateHistory.length) {
      return null;
    }

    this.currentState = this.stateHistory[version];
    return this.currentState;
  }

  /**
   * Get workflow progress
   */
  public getProgress(): {
    totalStages: number;
    completedStages: number;
    currentStage: string;
    percentComplete: number;
  } {
    if (!this.currentState) {
      return {
        totalStages: 0,
        completedStages: 0,
        currentStage: "",
        percentComplete: 0,
      };
    }

    const totalStages = 9; // Total workflow stages
    const completedStages = this.currentState.completedStages.length;
    const percentComplete = Math.round((completedStages / totalStages) * 100);

    return {
      totalStages,
      completedStages,
      currentStage: this.currentState.currentStage,
      percentComplete,
    };
  }

  /**
   * Serialize state for persistence
   */
  public serializeState(): string {
    if (!this.currentState) return "{}";
    return JSON.stringify(this.currentState, null, 2);
  }

  /**
   * Deserialize state from persistence
   */
  public deserializeState(serializedState: string): FuneralWorkflowState {
    const stateData = JSON.parse(serializedState);
    
    // Convert date strings back to Date objects
    const processedState = this.processDates(stateData);
    
    const validation = FuneralWorkflowStateSchema.safeParse(processedState);
    if (!validation.success) {
      throw new Error(`Invalid serialized state: ${validation.error.message}`);
    }

    this.currentState = validation.data;
    return validation.data;
  }

  /**
   * Process date strings in deserialized state
   */
  private processDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.processDates(item));
    }
    
    if (typeof obj === "object") {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processDates(value);
      }
      return processed;
    }
    
    return obj;
  }
}

// Export default instance
export const stateManager = new FuneralWorkflowStateManager();