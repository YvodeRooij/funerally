/**
 * Document Collection and Verification Agent
 * 
 * Manages document collection, verification, and processing for funeral planning.
 * Handles legal documents, certificates, permits, and personal papers.
 */

import { StateGraph, Annotation, interrupt } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

// Document type definitions
export enum DocumentType {
  // Legal documents
  DEATH_CERTIFICATE = "death_certificate",
  BURIAL_PERMIT = "burial_permit",
  CREMATION_PERMIT = "cremation_permit",
  
  // Personal documents
  IDENTIFICATION = "identification",
  SOCIAL_SECURITY_CARD = "social_security_card",
  BIRTH_CERTIFICATE = "birth_certificate",
  MARRIAGE_CERTIFICATE = "marriage_certificate",
  DIVORCE_DECREE = "divorce_decree",
  
  // Financial documents
  INSURANCE_POLICY = "insurance_policy",
  BANK_STATEMENTS = "bank_statements",
  WILL = "will",
  TRUST_DOCUMENTS = "trust_documents",
  FINANCIAL_POWER_OF_ATTORNEY = "financial_power_of_attorney",
  
  // Medical documents
  MEDICAL_EXAMINER_RELEASE = "medical_examiner_release",
  AUTOPSY_REPORT = "autopsy_report",
  ORGAN_DONATION_RECORDS = "organ_donation_records",
  MEDICAL_RECORDS = "medical_records",
  
  // Military and service documents
  MILITARY_DISCHARGE_PAPERS = "military_discharge_papers",
  VETERANS_BENEFITS = "veterans_benefits",
  SERVICE_RECORDS = "service_records",
  
  // Personal and memorial documents
  PERSONAL_EFFECTS_INVENTORY = "personal_effects_inventory",
  FUNERAL_PREFERENCES = "funeral_preferences",
  MEMORIAL_INSTRUCTIONS = "memorial_instructions",
  PHOTOS_AND_MEMORIES = "photos_and_memories",
  
  // Custom documents
  CUSTOM_DOCUMENT = "custom_document",
}

export enum DocumentStatus {
  NOT_REQUIRED = "not_required",
  REQUIRED = "required",
  REQUESTED = "requested",
  PENDING_UPLOAD = "pending_upload",
  UPLOADED = "uploaded",
  UNDER_REVIEW = "under_review",
  VERIFIED = "verified",
  APPROVED = "approved",
  REJECTED = "rejected",
  EXPIRED = "expired",
  MISSING = "missing",
}

export enum DocumentPriority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  OPTIONAL = "optional",
}

export const DocumentSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(DocumentType),
  name: z.string(),
  description: z.string(),
  status: z.nativeEnum(DocumentStatus),
  priority: z.nativeEnum(DocumentPriority),
  
  // File information
  filename: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  uploadedAt: z.date().optional(),
  uploadedBy: z.string().optional(),
  
  // Verification information
  verificationRequired: z.boolean(),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().optional(),
  verificationNotes: z.string().optional(),
  
  // Legal requirements
  legalRequirement: z.boolean(),
  jurisdiction: z.string().optional(),
  expirationDate: z.date().optional(),
  
  // Processing information
  extractedData: z.any().optional(),
  validationErrors: z.array(z.string()),
  processingNotes: z.array(z.string()),
  
  // Metadata
  tags: z.array(z.string()),
  category: z.string(),
  subcategory: z.string().optional(),
  confidentialityLevel: z.enum(["public", "private", "confidential", "restricted"]),
  
  // Workflow information
  nextActions: z.array(z.string()),
  dependencies: z.array(z.string()),
  relatedDocuments: z.array(z.string()),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  dueDate: z.date().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// Document collection state
export const DocumentCollectionState = Annotation.Root({
  documents: Annotation<Document[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  requirements: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  currentDocument: Annotation<Document | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  verificationQueue: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  extractionResults: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  validationErrors: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  notifications: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  currentStage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "initial",
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

/**
 * Document Collection and Verification Agent
 */
export class DocumentCollectionAgent {
  private graph: StateGraph<typeof DocumentCollectionState>;
  private documentRequirements: Map<string, Document[]> = new Map();
  private verificationRules: Map<DocumentType, any> = new Map();

  constructor() {
    this.graph = new StateGraph(DocumentCollectionState);
    this.initializeDocumentRequirements();
    this.initializeVerificationRules();
    this.buildWorkflow();
  }

  /**
   * Initialize document requirements by jurisdiction and service type
   */
  private initializeDocumentRequirements() {
    // Standard burial requirements
    this.documentRequirements.set("burial_standard", [
      {
        id: "death_cert_burial",
        type: DocumentType.DEATH_CERTIFICATE,
        name: "Death Certificate",
        description: "Official death certificate from vital records",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.CRITICAL,
        verificationRequired: true,
        legalRequirement: true,
        category: "legal",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["legal", "required", "burial"],
        nextActions: ["obtain_from_vital_records"],
        dependencies: [],
        relatedDocuments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "burial_permit_standard",
        type: DocumentType.BURIAL_PERMIT,
        name: "Burial Permit",
        description: "Permit allowing burial in cemetery",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.CRITICAL,
        verificationRequired: true,
        legalRequirement: true,
        category: "legal",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["legal", "required", "burial"],
        nextActions: ["apply_with_municipality"],
        dependencies: ["death_cert_burial"],
        relatedDocuments: ["death_cert_burial"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Cremation requirements
    this.documentRequirements.set("cremation_standard", [
      {
        id: "death_cert_cremation",
        type: DocumentType.DEATH_CERTIFICATE,
        name: "Death Certificate",
        description: "Official death certificate from vital records",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.CRITICAL,
        verificationRequired: true,
        legalRequirement: true,
        category: "legal",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["legal", "required", "cremation"],
        nextActions: ["obtain_from_vital_records"],
        dependencies: [],
        relatedDocuments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cremation_permit_standard",
        type: DocumentType.CREMATION_PERMIT,
        name: "Cremation Permit",
        description: "Permit allowing cremation",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.CRITICAL,
        verificationRequired: true,
        legalRequirement: true,
        category: "legal",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["legal", "required", "cremation"],
        nextActions: ["apply_with_municipality"],
        dependencies: ["death_cert_cremation"],
        relatedDocuments: ["death_cert_cremation"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Military service requirements
    this.documentRequirements.set("military_service", [
      {
        id: "military_discharge",
        type: DocumentType.MILITARY_DISCHARGE_PAPERS,
        name: "Military Discharge Papers (DD-214)",
        description: "Official military discharge documentation",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.HIGH,
        verificationRequired: true,
        legalRequirement: false,
        category: "military",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["military", "benefits", "veteran"],
        nextActions: ["verify_with_va"],
        dependencies: [],
        relatedDocuments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }

  /**
   * Initialize verification rules for different document types
   */
  private initializeVerificationRules() {
    // Death certificate verification rules
    this.verificationRules.set(DocumentType.DEATH_CERTIFICATE, {
      requiredFields: [
        "decedent_name",
        "date_of_death",
        "cause_of_death",
        "place_of_death",
        "file_number",
        "issuing_authority",
      ],
      validationRules: [
        {
          field: "date_of_death",
          type: "date",
          validation: "must_be_past_date",
        },
        {
          field: "file_number",
          type: "string",
          validation: "must_be_unique",
        },
      ],
      verificationSources: ["vital_records_office", "medical_examiner"],
      expirationPeriod: null, // Does not expire
    });

    // Insurance policy verification rules
    this.verificationRules.set(DocumentType.INSURANCE_POLICY, {
      requiredFields: [
        "policy_number",
        "beneficiary",
        "coverage_amount",
        "effective_date",
        "insurance_company",
      ],
      validationRules: [
        {
          field: "coverage_amount",
          type: "number",
          validation: "must_be_positive",
        },
        {
          field: "effective_date",
          type: "date",
          validation: "must_be_past_date",
        },
      ],
      verificationSources: ["insurance_company"],
      expirationPeriod: "varies", // Depends on policy
    });

    // Military discharge papers verification
    this.verificationRules.set(DocumentType.MILITARY_DISCHARGE_PAPERS, {
      requiredFields: [
        "service_member_name",
        "service_number",
        "dates_of_service",
        "discharge_type",
        "military_branch",
      ],
      validationRules: [
        {
          field: "discharge_type",
          type: "enum",
          validation: "must_be_valid_discharge_type",
        },
      ],
      verificationSources: ["department_of_veterans_affairs", "military_personnel_records"],
      expirationPeriod: null, // Does not expire
    });
  }

  /**
   * Build the document collection workflow
   */
  private buildWorkflow() {
    this.graph.addNode("requirements_assessment", this.requirementsAssessmentNode.bind(this));
    this.graph.addNode("document_identification", this.documentIdentificationNode.bind(this));
    this.graph.addNode("collection_orchestration", this.collectionOrchestrationNode.bind(this));
    this.graph.addNode("upload_processing", this.uploadProcessingNode.bind(this));
    this.graph.addNode("data_extraction", this.dataExtractionNode.bind(this));
    this.graph.addNode("verification_queue", this.verificationQueueNode.bind(this));
    this.graph.addNode("document_verification", this.documentVerificationNode.bind(this));
    this.graph.addNode("validation_check", this.validationCheckNode.bind(this));
    this.graph.addNode("approval_process", this.approvalProcessNode.bind(this));
    this.graph.addNode("notification_system", this.notificationSystemNode.bind(this));
    this.graph.addNode("completion_check", this.completionCheckNode.bind(this));

    // Define workflow edges
    this.graph.addEdge("requirements_assessment", "document_identification");
    this.graph.addEdge("document_identification", "collection_orchestration");
    this.graph.addEdge("collection_orchestration", "upload_processing");
    this.graph.addEdge("upload_processing", "data_extraction");
    this.graph.addEdge("data_extraction", "verification_queue");
    this.graph.addEdge("verification_queue", "document_verification");
    this.graph.addEdge("document_verification", "validation_check");
    
    this.graph.addConditionalEdges(
      "validation_check",
      this.routeFromValidation.bind(this),
      {
        "approve": "approval_process",
        "reject": "notification_system",
        "retry": "collection_orchestration",
      }
    );

    this.graph.addEdge("approval_process", "notification_system");
    this.graph.addEdge("notification_system", "completion_check");
    
    this.graph.addConditionalEdges(
      "completion_check",
      this.routeFromCompletion.bind(this),
      {
        "complete": "__end__",
        "continue": "collection_orchestration",
      }
    );

    // Compile with interrupt points for human interaction
    this.graph = this.graph.compile({
      interruptBefore: ["approval_process"],
      interruptAfter: ["notification_system"],
    });
  }

  /**
   * Assess document requirements based on service type and jurisdiction
   */
  private async requirementsAssessmentNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Assessing document requirements");

    const requirements = state.requirements || {};
    const serviceType = requirements.serviceType || "burial_standard";
    const jurisdiction = requirements.jurisdiction || "standard";
    
    // Get required documents for this service type
    const requiredDocuments = this.documentRequirements.get(serviceType) || [];
    
    // Add optional documents based on family situation
    const optionalDocuments: Document[] = [];
    
    if (requirements.militaryService) {
      const militaryDocs = this.documentRequirements.get("military_service") || [];
      optionalDocuments.push(...militaryDocs);
    }

    if (requirements.hasInsurance) {
      optionalDocuments.push({
        id: "insurance_policy_opt",
        type: DocumentType.INSURANCE_POLICY,
        name: "Life Insurance Policy",
        description: "Life insurance policy for benefit claims",
        status: DocumentStatus.REQUIRED,
        priority: DocumentPriority.HIGH,
        verificationRequired: true,
        legalRequirement: false,
        category: "financial",
        confidentialityLevel: "private",
        validationErrors: [],
        processingNotes: [],
        tags: ["financial", "insurance", "benefits"],
        nextActions: ["contact_insurance_company"],
        dependencies: [],
        relatedDocuments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const allDocuments = [...requiredDocuments, ...optionalDocuments];

    return {
      documents: allDocuments,
      currentStage: "document_identification",
      messages: [
        new AIMessage({
          content: `Document requirements assessed. ${allDocuments.length} documents identified for collection.`,
        }),
      ],
    };
  }

  /**
   * Identify and categorize documents
   */
  private async documentIdentificationNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Identifying and categorizing documents");

    const documents = state.documents || [];
    
    // Categorize documents by priority and type
    const criticalDocs = documents.filter(doc => doc.priority === DocumentPriority.CRITICAL);
    const highPriorityDocs = documents.filter(doc => doc.priority === DocumentPriority.HIGH);
    const mediumPriorityDocs = documents.filter(doc => doc.priority === DocumentPriority.MEDIUM);
    
    // Create collection plan
    const collectionPlan = {
      totalDocuments: documents.length,
      criticalDocuments: criticalDocs.length,
      highPriorityDocuments: highPriorityDocs.length,
      mediumPriorityDocuments: mediumPriorityDocs.length,
      estimatedTimeToComplete: this.calculateCollectionTime(documents),
    };

    return {
      currentStage: "collection_orchestration",
      messages: [
        new AIMessage({
          content: `Document identification complete. Collection plan: ${criticalDocs.length} critical, ${highPriorityDocs.length} high priority, ${mediumPriorityDocs.length} medium priority documents.`,
        }),
      ],
    };
  }

  /**
   * Orchestrate document collection process
   */
  private async collectionOrchestrationNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Orchestrating document collection");

    const documents = state.documents || [];
    const pendingDocuments = documents.filter(doc => 
      doc.status === DocumentStatus.REQUIRED || 
      doc.status === DocumentStatus.REQUESTED ||
      doc.status === DocumentStatus.PENDING_UPLOAD
    );

    // Prioritize collection order
    const collectionOrder = pendingDocuments
      .sort((a, b) => {
        const priorityOrder = {
          [DocumentPriority.CRITICAL]: 5,
          [DocumentPriority.HIGH]: 4,
          [DocumentPriority.MEDIUM]: 3,
          [DocumentPriority.LOW]: 2,
          [DocumentPriority.OPTIONAL]: 1,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    // Generate collection instructions
    const instructions = collectionOrder.map(doc => ({
      documentId: doc.id,
      documentName: doc.name,
      instructions: doc.nextActions.join("; "),
      priority: doc.priority,
      dueDate: doc.dueDate,
    }));

    return {
      currentStage: "upload_processing",
      notifications: [{
        type: "collection_instructions",
        data: instructions,
        timestamp: new Date(),
      }],
      messages: [
        new AIMessage({
          content: `Collection orchestration complete. ${instructions.length} documents queued for collection.`,
        }),
      ],
    };
  }

  /**
   * Process uploaded documents
   */
  private async uploadProcessingNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Processing uploaded documents");

    // Simulate document upload processing
    const documents = state.documents || [];
    const uploadedDocuments = documents.filter(doc => doc.status === DocumentStatus.UPLOADED);

    const processedUploads = uploadedDocuments.map(doc => ({
      ...doc,
      status: DocumentStatus.UNDER_REVIEW,
      processingNotes: [...doc.processingNotes, "Document uploaded and queued for processing"],
      updatedAt: new Date(),
    }));

    return {
      documents: processedUploads,
      currentStage: "data_extraction",
      messages: [
        new AIMessage({
          content: `Upload processing complete. ${processedUploads.length} documents processed.`,
        }),
      ],
    };
  }

  /**
   * Extract data from documents using OCR/AI
   */
  private async dataExtractionNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Extracting data from documents");

    const documents = state.documents || [];
    const documentsForExtraction = documents.filter(doc => 
      doc.status === DocumentStatus.UNDER_REVIEW && !doc.extractedData
    );

    const extractionResults: any[] = [];

    for (const doc of documentsForExtraction) {
      // Simulate data extraction
      const extractedData = await this.extractDocumentData(doc);
      extractionResults.push({
        documentId: doc.id,
        extractedData,
        extractionTimestamp: new Date(),
        confidence: 0.95, // Simulated confidence score
      });
    }

    return {
      extractionResults,
      currentStage: "verification_queue",
      messages: [
        new AIMessage({
          content: `Data extraction complete. ${extractionResults.length} documents processed.`,
        }),
      ],
    };
  }

  /**
   * Manage verification queue
   */
  private async verificationQueueNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Managing verification queue");

    const documents = state.documents || [];
    const extractionResults = state.extractionResults || [];
    
    // Add documents to verification queue
    const verificationQueue = extractionResults.map(result => result.documentId);

    // Priority-based queue ordering
    const prioritizedQueue = verificationQueue.sort((a, b) => {
      const docA = documents.find(doc => doc.id === a);
      const docB = documents.find(doc => doc.id === b);
      
      if (!docA || !docB) return 0;
      
      const priorityOrder = {
        [DocumentPriority.CRITICAL]: 5,
        [DocumentPriority.HIGH]: 4,
        [DocumentPriority.MEDIUM]: 3,
        [DocumentPriority.LOW]: 2,
        [DocumentPriority.OPTIONAL]: 1,
      };
      
      return priorityOrder[docB.priority] - priorityOrder[docA.priority];
    });

    return {
      verificationQueue: prioritizedQueue,
      currentStage: "document_verification",
      messages: [
        new AIMessage({
          content: `Verification queue managed. ${prioritizedQueue.length} documents queued for verification.`,
        }),
      ],
    };
  }

  /**
   * Verify documents against requirements and rules
   */
  private async documentVerificationNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Verifying documents");

    const verificationQueue = state.verificationQueue || [];
    const documents = state.documents || [];
    const extractionResults = state.extractionResults || [];

    const verificationResults: any[] = [];

    for (const documentId of verificationQueue) {
      const document = documents.find(doc => doc.id === documentId);
      const extractedData = extractionResults.find(result => result.documentId === documentId);

      if (!document || !extractedData) continue;

      const verificationResult = await this.verifyDocument(document, extractedData.extractedData);
      verificationResults.push({
        documentId,
        verificationResult,
        verificationTimestamp: new Date(),
      });
    }

    return {
      currentStage: "validation_check",
      messages: [
        new AIMessage({
          content: `Document verification complete. ${verificationResults.length} documents verified.`,
        }),
      ],
    };
  }

  /**
   * Validate documents against business rules
   */
  private async validationCheckNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Performing validation checks");

    const documents = state.documents || [];
    const validationErrors: any[] = [];

    // Perform cross-document validation
    for (const doc of documents) {
      if (doc.dependencies.length > 0) {
        const dependencyErrors = this.validateDependencies(doc, documents);
        if (dependencyErrors.length > 0) {
          validationErrors.push({
            documentId: doc.id,
            errors: dependencyErrors,
            severity: "high",
          });
        }
      }
    }

    // Check for completeness
    const requiredDocuments = documents.filter(doc => 
      doc.priority === DocumentPriority.CRITICAL && 
      doc.status !== DocumentStatus.VERIFIED
    );

    const isComplete = requiredDocuments.length === 0;
    const hasErrors = validationErrors.length > 0;

    return {
      validationErrors,
      currentStage: hasErrors ? "collection_orchestration" : (isComplete ? "approval_process" : "collection_orchestration"),
      messages: [
        new AIMessage({
          content: `Validation check complete. ${validationErrors.length} errors found. Complete: ${isComplete}`,
        }),
      ],
    };
  }

  /**
   * Route from validation check
   */
  private routeFromValidation(state: typeof DocumentCollectionState.State): string {
    const validationErrors = state.validationErrors || [];
    const documents = state.documents || [];
    
    if (validationErrors.length > 0) {
      return "reject";
    }

    const requiredDocuments = documents.filter(doc => 
      doc.priority === DocumentPriority.CRITICAL && 
      doc.status !== DocumentStatus.VERIFIED
    );

    if (requiredDocuments.length === 0) {
      return "approve";
    }

    return "retry";
  }

  /**
   * Process approvals with human-in-the-loop
   */
  private async approvalProcessNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Processing approvals");

    const documents = state.documents || [];
    
    // Prepare approval package for human review
    const approvalPackage = {
      totalDocuments: documents.length,
      verifiedDocuments: documents.filter(doc => doc.status === DocumentStatus.VERIFIED).length,
      pendingDocuments: documents.filter(doc => doc.status !== DocumentStatus.VERIFIED),
      validationSummary: state.validationErrors || [],
      recommendations: this.generateApprovalRecommendations(documents),
    };

    // Trigger human-in-the-loop interrupt
    await interrupt({
      value: approvalPackage,
      when: "always",
    });

    return {
      currentStage: "notification_system",
      messages: [
        new AIMessage({
          content: `Approval process initiated. Human review required for ${approvalPackage.pendingDocuments.length} pending items.`,
        }),
      ],
    };
  }

  /**
   * Manage notifications to stakeholders
   */
  private async notificationSystemNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Managing notifications");

    const documents = state.documents || [];
    const validationErrors = state.validationErrors || [];
    
    const notifications: any[] = [];

    // Generate status notifications
    notifications.push({
      type: "status_update",
      recipients: ["family_primary", "director"],
      message: `Document collection status: ${documents.filter(doc => doc.status === DocumentStatus.VERIFIED).length}/${documents.length} documents verified`,
      timestamp: new Date(),
    });

    // Generate error notifications if any
    if (validationErrors.length > 0) {
      notifications.push({
        type: "validation_errors",
        recipients: ["family_primary"],
        message: `${validationErrors.length} document validation errors require attention`,
        data: validationErrors,
        timestamp: new Date(),
      });
    }

    return {
      notifications,
      currentStage: "completion_check",
      messages: [
        new AIMessage({
          content: `Notifications sent. ${notifications.length} notifications dispatched.`,
        }),
      ],
    };
  }

  /**
   * Check if document collection is complete
   */
  private async completionCheckNode(state: typeof DocumentCollectionState.State) {
    console.log("[Document Agent] Checking completion status");

    const documents = state.documents || [];
    
    const requiredDocuments = documents.filter(doc => 
      doc.priority === DocumentPriority.CRITICAL || doc.priority === DocumentPriority.HIGH
    );
    
    const verifiedDocuments = documents.filter(doc => doc.status === DocumentStatus.VERIFIED);
    
    const isComplete = requiredDocuments.every(doc => doc.status === DocumentStatus.VERIFIED);
    const completionPercentage = Math.round((verifiedDocuments.length / documents.length) * 100);

    return {
      currentStage: isComplete ? "completed" : "collection_orchestration",
      messages: [
        new AIMessage({
          content: `Completion check: ${completionPercentage}% complete. ${isComplete ? "All required documents verified." : "Additional documents needed."}`,
        }),
      ],
    };
  }

  /**
   * Route from completion check
   */
  private routeFromCompletion(state: typeof DocumentCollectionState.State): string {
    const documents = state.documents || [];
    const requiredDocuments = documents.filter(doc => 
      doc.priority === DocumentPriority.CRITICAL || doc.priority === DocumentPriority.HIGH
    );
    
    const isComplete = requiredDocuments.every(doc => doc.status === DocumentStatus.VERIFIED);
    return isComplete ? "complete" : "continue";
  }

  /**
   * Helper methods
   */
  private calculateCollectionTime(documents: Document[]): string {
    const criticalCount = documents.filter(doc => doc.priority === DocumentPriority.CRITICAL).length;
    const highCount = documents.filter(doc => doc.priority === DocumentPriority.HIGH).length;
    
    // Rough estimation based on document complexity
    const estimatedDays = (criticalCount * 2) + (highCount * 1) + 1;
    return `${estimatedDays} business days`;
  }

  private async extractDocumentData(document: Document): Promise<any> {
    // Simulate document data extraction based on type
    const rules = this.verificationRules.get(document.type);
    if (!rules) return {};

    // Return mock extracted data based on required fields
    const extractedData: any = {};
    for (const field of rules.requiredFields) {
      extractedData[field] = `extracted_${field}_value`;
    }
    
    return extractedData;
  }

  private async verifyDocument(document: Document, extractedData: any): Promise<any> {
    const rules = this.verificationRules.get(document.type);
    if (!rules) {
      return { verified: false, reason: "No verification rules found" };
    }

    // Check required fields
    for (const field of rules.requiredFields) {
      if (!extractedData[field]) {
        return { verified: false, reason: `Missing required field: ${field}` };
      }
    }

    // Apply validation rules
    for (const rule of rules.validationRules) {
      const fieldValue = extractedData[rule.field];
      if (!this.validateField(fieldValue, rule)) {
        return { verified: false, reason: `Validation failed for ${rule.field}: ${rule.validation}` };
      }
    }

    return { verified: true, confidence: 0.95 };
  }

  private validateField(value: any, rule: any): boolean {
    switch (rule.validation) {
      case "must_be_past_date":
        return new Date(value) < new Date();
      case "must_be_positive":
        return Number(value) > 0;
      case "must_be_unique":
        return !!value; // Simplified for mock
      default:
        return true;
    }
  }

  private validateDependencies(document: Document, allDocuments: Document[]): string[] {
    const errors: string[] = [];
    
    for (const dependencyId of document.dependencies) {
      const dependency = allDocuments.find(doc => doc.id === dependencyId);
      if (!dependency) {
        errors.push(`Missing dependency: ${dependencyId}`);
      } else if (dependency.status !== DocumentStatus.VERIFIED) {
        errors.push(`Dependency not verified: ${dependency.name}`);
      }
    }
    
    return errors;
  }

  private generateApprovalRecommendations(documents: Document[]): any[] {
    const recommendations: any[] = [];
    
    const unverifiedCritical = documents.filter(doc => 
      doc.priority === DocumentPriority.CRITICAL && doc.status !== DocumentStatus.VERIFIED
    );
    
    if (unverifiedCritical.length > 0) {
      recommendations.push({
        type: "blocking",
        message: `${unverifiedCritical.length} critical documents must be verified before proceeding`,
        documents: unverifiedCritical.map(doc => doc.name),
      });
    }
    
    return recommendations;
  }

  /**
   * Public methods
   */
  public async processDocuments(requirements: any, config?: any) {
    return await this.graph.invoke({ requirements }, config);
  }

  public async streamDocumentProcessing(requirements: any, config?: any) {
    return this.graph.stream({ requirements }, config);
  }

  public getDocumentRequirements(serviceType: string): Document[] {
    return this.documentRequirements.get(serviceType) || [];
  }

  public addDocumentRequirement(serviceType: string, document: Document) {
    const existing = this.documentRequirements.get(serviceType) || [];
    existing.push(document);
    this.documentRequirements.set(serviceType, existing);
  }

  public getVerificationRules(documentType: DocumentType): any {
    return this.verificationRules.get(documentType);
  }

  public getGraph() {
    return this.graph;
  }
}

// Export default instance
export const documentCollectionAgent = new DocumentCollectionAgent();