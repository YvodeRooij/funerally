/**
 * Human-in-the-Loop Agent
 * 
 * Manages sensitive decisions and interrupts in the funeral planning workflow.
 * Handles approval processes, family decisions, and ethical considerations.
 */

import { StateGraph, Annotation, interrupt } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

// Decision types that require human input
export enum DecisionType {
  SERVICE_DETAILS = "service_details",
  COST_APPROVAL = "cost_approval",
  CULTURAL_SENSITIVITY = "cultural_sensitivity",
  VENUE_SELECTION = "venue_selection",
  DOCUMENT_VERIFICATION = "document_verification",
  FAMILY_CONFLICT = "family_conflict",
  ETHICAL_CONCERN = "ethical_concern",
  EMERGENCY_DECISION = "emergency_decision",
  CUSTOM_REQUEST = "custom_request",
}

// Decision priority levels
export enum DecisionPriority {
  IMMEDIATE = "immediate",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Decision schema
export const DecisionSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(DecisionType),
  priority: z.nativeEnum(DecisionPriority),
  title: z.string(),
  description: z.string(),
  context: z.any(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    implications: z.array(z.string()),
    recommendedBy: z.string().optional(),
  })),
  requiredApprovers: z.array(z.string()),
  currentApprovers: z.array(z.string()),
  deadline: z.date().optional(),
  culturalConsiderations: z.array(z.string()).optional(),
  ethicalConsiderations: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(["pending", "approved", "rejected", "deferred"]),
});

export type Decision = z.infer<typeof DecisionSchema>;

// Human-in-the-loop state
export const HumanInLoopState = Annotation.Root({
  pendingDecisions: Annotation<Decision[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  completedDecisions: Annotation<Decision[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  currentDecision: Annotation<Decision | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  humanInput: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  escalationLevel: Annotation<number>({
    reducer: (x, y) => Math.max(x, y),
    default: () => 0,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export class HumanInLoopAgent {
  private graph: StateGraph<typeof HumanInLoopState>;

  constructor() {
    this.graph = new StateGraph(HumanInLoopState);
    this.buildWorkflow();
  }

  private buildWorkflow() {
    // Add nodes
    this.graph.addNode("decision_analyzer", this.decisionAnalyzerNode.bind(this));
    this.graph.addNode("priority_assessor", this.priorityAssessorNode.bind(this));
    this.graph.addNode("cultural_validator", this.culturalValidatorNode.bind(this));
    this.graph.addNode("ethical_reviewer", this.ethicalReviewerNode.bind(this));
    this.graph.addNode("human_interface", this.humanInterfaceNode.bind(this));
    this.graph.addNode("approval_processor", this.approvalProcessorNode.bind(this));
    this.graph.addNode("escalation_handler", this.escalationHandlerNode.bind(this));
    this.graph.addNode("decision_executor", this.decisionExecutorNode.bind(this));

    // Define workflow
    this.graph.addEdge("decision_analyzer", "priority_assessor");
    this.graph.addEdge("priority_assessor", "cultural_validator");
    this.graph.addEdge("cultural_validator", "ethical_reviewer");
    this.graph.addEdge("ethical_reviewer", "human_interface");
    this.graph.addEdge("human_interface", "approval_processor");
    
    this.graph.addConditionalEdges(
      "approval_processor",
      this.routeFromApprovalProcessor.bind(this),
      {
        "escalation": "escalation_handler",
        "execute": "decision_executor",
        "retry": "human_interface",
      }
    );

    this.graph.addEdge("escalation_handler", "human_interface");
    this.graph.addEdge("decision_executor", "__end__");

    // Compile with interrupt points
    this.graph = this.graph.compile({
      interruptBefore: ["human_interface", "escalation_handler"],
      interruptAfter: ["decision_executor"],
    });
  }

  /**
   * Analyze incoming decisions and prepare for human review
   */
  private async decisionAnalyzerNode(state: typeof HumanInLoopState.State) {
    const pendingDecisions = state.pendingDecisions || [];
    
    if (pendingDecisions.length === 0) {
      return {
        messages: [new AIMessage({ content: "No pending decisions to analyze." })],
      };
    }

    // Get the highest priority decision
    const currentDecision = this.getHighestPriorityDecision(pendingDecisions);
    
    return {
      currentDecision,
      messages: [
        new AIMessage({
          content: `Analyzing decision: ${currentDecision.title} (Priority: ${currentDecision.priority})`,
        }),
      ],
    };
  }

  /**
   * Assess and update decision priority based on context
   */
  private async priorityAssessorNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    if (!decision) return {};

    // Assess priority based on various factors
    let adjustedPriority = decision.priority;
    
    // Time-sensitive decisions
    if (decision.deadline && decision.deadline.getTime() - Date.now() < 86400000) { // 24 hours
      adjustedPriority = DecisionPriority.HIGH;
    }

    // Cultural or ethical sensitivity
    if (decision.culturalConsiderations?.length || decision.ethicalConsiderations?.length) {
      if (adjustedPriority === DecisionPriority.LOW) {
        adjustedPriority = DecisionPriority.MEDIUM;
      }
    }

    // Update decision with adjusted priority
    const updatedDecision = {
      ...decision,
      priority: adjustedPriority,
      updatedAt: new Date(),
    };

    return {
      currentDecision: updatedDecision,
      messages: [
        new AIMessage({
          content: `Priority assessment complete. Decision priority: ${adjustedPriority}`,
        }),
      ],
    };
  }

  /**
   * Validate cultural considerations
   */
  private async culturalValidatorNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    if (!decision) return {};

    const culturalFlags = [];

    // Check for cultural sensitivity markers
    if (decision.type === DecisionType.SERVICE_DETAILS) {
      culturalFlags.push("Religious customs validation required");
    }

    if (decision.type === DecisionType.VENUE_SELECTION) {
      culturalFlags.push("Venue cultural appropriateness check");
    }

    // Add cultural considerations to decision
    const updatedDecision = {
      ...decision,
      culturalConsiderations: [
        ...(decision.culturalConsiderations || []),
        ...culturalFlags,
      ],
      updatedAt: new Date(),
    };

    return {
      currentDecision: updatedDecision,
      messages: [
        new AIMessage({
          content: `Cultural validation complete. ${culturalFlags.length} considerations identified.`,
        }),
      ],
    };
  }

  /**
   * Review ethical implications
   */
  private async ethicalReviewerNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    if (!decision) return {};

    const ethicalFlags = [];

    // Check for ethical concerns
    if (decision.type === DecisionType.COST_APPROVAL) {
      ethicalFlags.push("Financial burden assessment");
    }

    if (decision.type === DecisionType.FAMILY_CONFLICT) {
      ethicalFlags.push("Family dynamics consideration");
    }

    // Add ethical considerations
    const updatedDecision = {
      ...decision,
      ethicalConsiderations: [
        ...(decision.ethicalConsiderations || []),
        ...ethicalFlags,
      ],
      updatedAt: new Date(),
    };

    return {
      currentDecision: updatedDecision,
      messages: [
        new AIMessage({
          content: `Ethical review complete. ${ethicalFlags.length} considerations identified.`,
        }),
      ],
    };
  }

  /**
   * Human interface node - triggers interrupt for human input
   */
  private async humanInterfaceNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    if (!decision) return {};

    // Prepare human interface data
    const interfaceData = {
      decision,
      recommendedAction: this.getRecommendedAction(decision),
      urgencyLevel: this.calculateUrgencyLevel(decision),
      contextualInformation: this.gatherContextualInformation(decision),
    };

    // Trigger interrupt for human input
    await interrupt({
      value: interfaceData,
      when: "always", // Always interrupt for human decisions
    });

    return {
      messages: [
        new AIMessage({
          content: `Human interface activated for decision: ${decision.title}`,
        }),
      ],
    };
  }

  /**
   * Process approval decisions from human input
   */
  private async approvalProcessorNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    const humanInput = state.humanInput;
    
    if (!decision || !humanInput) {
      return {
        messages: [
          new AIMessage({
            content: "Missing decision or human input for approval processing.",
          }),
        ],
      };
    }

    // Process the human input
    const processedDecision = {
      ...decision,
      status: humanInput.approved ? "approved" : "rejected",
      currentApprovers: [...decision.currentApprovers, humanInput.approverId],
      updatedAt: new Date(),
    };

    // Check if all required approvers have responded
    const allApproversResponded = decision.requiredApprovers.every(
      approver => processedDecision.currentApprovers.includes(approver)
    );

    return {
      currentDecision: processedDecision,
      messages: [
        new AIMessage({
          content: `Approval processed. Status: ${processedDecision.status}. All approvers responded: ${allApproversResponded}`,
        }),
      ],
    };
  }

  /**
   * Handle escalation scenarios
   */
  private async escalationHandlerNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    const escalationLevel = state.escalationLevel;
    
    if (!decision) return {};

    const newEscalationLevel = escalationLevel + 1;
    
    // Define escalation actions based on level
    const escalationActions = {
      1: "Notify family liaison",
      2: "Escalate to senior director",
      3: "Involve cultural advisor",
      4: "Executive decision required",
    };

    const escalationAction = escalationActions[newEscalationLevel as keyof typeof escalationActions] || "Maximum escalation reached";

    return {
      escalationLevel: newEscalationLevel,
      messages: [
        new AIMessage({
          content: `Escalation Level ${newEscalationLevel}: ${escalationAction}`,
        }),
      ],
    };
  }

  /**
   * Execute the final decision
   */
  private async decisionExecutorNode(state: typeof HumanInLoopState.State) {
    const decision = state.currentDecision;
    if (!decision) return {};

    // Move decision to completed
    const completedDecision = {
      ...decision,
      status: "approved" as const,
      updatedAt: new Date(),
    };

    return {
      completedDecisions: [completedDecision],
      currentDecision: null,
      messages: [
        new AIMessage({
          content: `Decision executed: ${decision.title}`,
        }),
      ],
    };
  }

  /**
   * Route from approval processor based on decision state
   */
  private routeFromApprovalProcessor(state: typeof HumanInLoopState.State): string {
    const decision = state.currentDecision;
    
    if (!decision) return "retry";

    // Check if escalation is needed
    if (decision.status === "rejected" && state.escalationLevel < 3) {
      return "escalation";
    }

    // Check if all approvers have responded
    const allApproversResponded = decision.requiredApprovers.every(
      approver => decision.currentApprovers.includes(approver)
    );

    if (allApproversResponded && decision.status === "approved") {
      return "execute";
    }

    return "retry";
  }

  /**
   * Utility methods
   */
  private getHighestPriorityDecision(decisions: Decision[]): Decision {
    const priorityOrder = {
      [DecisionPriority.IMMEDIATE]: 4,
      [DecisionPriority.HIGH]: 3,
      [DecisionPriority.MEDIUM]: 2,
      [DecisionPriority.LOW]: 1,
    };

    return decisions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])[0];
  }

  private getRecommendedAction(decision: Decision): string {
    // AI-generated recommendation based on decision context
    return `Recommended action for ${decision.type}: Review options carefully considering cultural and ethical implications.`;
  }

  private calculateUrgencyLevel(decision: Decision): number {
    let urgency = 1;
    
    if (decision.priority === DecisionPriority.IMMEDIATE) urgency += 3;
    if (decision.priority === DecisionPriority.HIGH) urgency += 2;
    if (decision.deadline && decision.deadline.getTime() - Date.now() < 86400000) urgency += 2;
    if (decision.culturalConsiderations?.length) urgency += 1;
    if (decision.ethicalConsiderations?.length) urgency += 1;
    
    return Math.min(urgency, 5);
  }

  private gatherContextualInformation(decision: Decision): any {
    return {
      decisionType: decision.type,
      priority: decision.priority,
      createdAt: decision.createdAt,
      deadline: decision.deadline,
      requiredApprovers: decision.requiredApprovers,
      context: decision.context,
    };
  }

  /**
   * Public methods for external interaction
   */
  public async processDecision(decision: Decision, config?: any) {
    return await this.graph.invoke({ pendingDecisions: [decision] }, config);
  }

  public async streamDecisionProcess(decision: Decision, config?: any) {
    return this.graph.stream({ pendingDecisions: [decision] }, config);
  }

  public getGraph() {
    return this.graph;
  }
}

/**
 * Factory function to create common decision types
 */
export class DecisionFactory {
  static createServiceDetailsDecision(serviceDetails: any): Decision {
    return {
      id: `service_${Date.now()}`,
      type: DecisionType.SERVICE_DETAILS,
      priority: DecisionPriority.HIGH,
      title: "Service Details Approval",
      description: "Review and approve funeral service details",
      context: serviceDetails,
      options: [
        {
          id: "approve",
          label: "Approve as planned",
          description: "Approve the service details as currently planned",
          implications: ["Service will proceed as outlined"],
        },
        {
          id: "modify",
          label: "Request modifications",
          description: "Request changes to the service details",
          implications: ["Service planning will be revised"],
        },
        {
          id: "defer",
          label: "Defer decision",
          description: "Postpone the decision for further consideration",
          implications: ["Service planning will be paused"],
        },
      ],
      requiredApprovers: ["family_primary", "director"],
      currentApprovers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    };
  }

  static createCostApprovalDecision(costBreakdown: any): Decision {
    return {
      id: `cost_${Date.now()}`,
      type: DecisionType.COST_APPROVAL,
      priority: DecisionPriority.HIGH,
      title: "Cost Approval",
      description: "Review and approve funeral service costs",
      context: costBreakdown,
      options: [
        {
          id: "approve_full",
          label: "Approve full cost",
          description: "Approve the complete cost estimate",
          implications: ["All services will be provided as quoted"],
        },
        {
          id: "approve_partial",
          label: "Approve with modifications",
          description: "Approve with some service modifications to reduce cost",
          implications: ["Service package will be adjusted"],
        },
        {
          id: "request_alternatives",
          label: "Request cost alternatives",
          description: "Request alternative pricing options",
          implications: ["Alternative service packages will be prepared"],
        },
      ],
      requiredApprovers: ["family_primary", "family_financial"],
      currentApprovers: [],
      ethicalConsiderations: ["Financial burden assessment"],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    };
  }
}

// Export default instance
export const humanInLoopAgent = new HumanInLoopAgent();