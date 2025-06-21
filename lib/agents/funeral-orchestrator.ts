/**
 * Funeral Planning Orchestrator Agent
 * 
 * Core LangGraph agent that coordinates the entire funeral planning workflow.
 * Handles state transitions, human-in-the-loop interactions, and agent coordination.
 */

import { StateGraph, StateGraphArgs, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// Define the workflow state schema
export const FuneralPlanningState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  planningStage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "initial",
  }),
  familyRequirements: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  culturalRequirements: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  documentsRequired: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  documentsCollected: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  venueRequirements: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  serviceDetails: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  approvals: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  pendingDecisions: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  errors: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  currentAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "orchestrator",
  }),
  timestamp: Annotation<Date>({
    reducer: (x, y) => y ?? x,
    default: () => new Date(),
  }),
});

// Workflow stages enum
export enum PlanningStage {
  INITIAL = "initial",
  REQUIREMENTS_GATHERING = "requirements_gathering",
  CULTURAL_ASSESSMENT = "cultural_assessment",
  DOCUMENT_COLLECTION = "document_collection",
  VENUE_SELECTION = "venue_selection",
  SERVICE_PLANNING = "service_planning",
  APPROVAL_PROCESS = "approval_process",
  COORDINATION = "coordination",
  EXECUTION = "execution",
  COMPLETED = "completed",
  ERROR = "error"
}

export class FuneralPlanningOrchestrator {
  private graph: StateGraph<typeof FuneralPlanningState>;

  constructor() {
    this.graph = new StateGraph(FuneralPlanningState);
    this.buildWorkflow();
  }

  private buildWorkflow() {
    // Add nodes for each workflow stage
    this.graph.addNode("orchestrator", this.orchestratorNode.bind(this));
    this.graph.addNode("requirements_gathering", this.requirementsGatheringNode.bind(this));
    this.graph.addNode("cultural_assessment", this.culturalAssessmentNode.bind(this));
    this.graph.addNode("document_collection", this.documentCollectionNode.bind(this));
    this.graph.addNode("venue_selection", this.venueSelectionNode.bind(this));
    this.graph.addNode("service_planning", this.servicePlanningNode.bind(this));
    this.graph.addNode("approval_process", this.approvalProcessNode.bind(this));
    this.graph.addNode("coordination", this.coordinationNode.bind(this));
    this.graph.addNode("human_review", this.humanReviewNode.bind(this));
    this.graph.addNode("error_handler", this.errorHandlerNode.bind(this));

    // Set entry point
    this.graph.addEdge(START, "orchestrator");

    // Define conditional edges based on workflow logic
    this.graph.addConditionalEdges(
      "orchestrator",
      this.routeFromOrchestrator.bind(this),
      {
        requirements_gathering: "requirements_gathering",
        cultural_assessment: "cultural_assessment",
        document_collection: "document_collection",
        venue_selection: "venue_selection",
        service_planning: "service_planning",
        approval_process: "approval_process",
        coordination: "coordination",
        human_review: "human_review",
        error: "error_handler",
        end: END,
      }
    );

    // Add edges back to orchestrator from each node
    this.graph.addEdge("requirements_gathering", "orchestrator");
    this.graph.addEdge("cultural_assessment", "orchestrator");
    this.graph.addEdge("document_collection", "orchestrator");
    this.graph.addEdge("venue_selection", "orchestrator");
    this.graph.addEdge("service_planning", "orchestrator");
    this.graph.addEdge("approval_process", "orchestrator");
    this.graph.addEdge("coordination", "orchestrator");
    this.graph.addEdge("human_review", "orchestrator");
    this.graph.addEdge("error_handler", "orchestrator");

    // Compile the graph
    this.graph = this.graph.compile({
      checkpointer: undefined, // Will be set when checkpointing is implemented
      interruptBefore: ["human_review", "approval_process"], // Human-in-the-loop points
    });
  }

  /**
   * Main orchestrator node - coordinates the entire workflow
   */
  private async orchestratorNode(state: typeof FuneralPlanningState.State) {
    console.log(`[Orchestrator] Current stage: ${state.planningStage}`);
    
    const currentStage = state.planningStage;
    const timestamp = new Date();

    // Update timestamp
    return {
      timestamp,
      messages: [
        new AIMessage({
          content: `Orchestrator processing stage: ${currentStage}`,
        }),
      ],
    };
  }

  /**
   * Route logic from orchestrator to next appropriate node
   */
  private routeFromOrchestrator(state: typeof FuneralPlanningState.State): string {
    const stage = state.planningStage;
    const errors = state.errors || [];
    
    // Check for errors first
    if (errors.length > 0) {
      return "error";
    }

    // Check if human review is needed
    if (state.pendingDecisions.length > 0) {
      return "human_review";
    }

    // Route based on current stage
    switch (stage) {
      case PlanningStage.INITIAL:
        return "requirements_gathering";
      
      case PlanningStage.REQUIREMENTS_GATHERING:
        return "cultural_assessment";
      
      case PlanningStage.CULTURAL_ASSESSMENT:
        return "document_collection";
      
      case PlanningStage.DOCUMENT_COLLECTION:
        // Check if all required documents are collected
        const requiredDocs = state.documentsRequired || [];
        const collectedDocs = state.documentsCollected || [];
        if (requiredDocs.every(doc => collectedDocs.includes(doc))) {
          return "venue_selection";
        }
        return "document_collection";
      
      case PlanningStage.VENUE_SELECTION:
        return "service_planning";
      
      case PlanningStage.SERVICE_PLANNING:
        return "approval_process";
      
      case PlanningStage.APPROVAL_PROCESS:
        // Check if all approvals are obtained
        const requiredApprovals = ["family", "director", "venue"];
        const obtainedApprovals = state.approvals || [];
        if (requiredApprovals.every(approval => obtainedApprovals.includes(approval))) {
          return "coordination";
        }
        return "human_review";
      
      case PlanningStage.COORDINATION:
        return "end";
      
      case PlanningStage.COMPLETED:
        return "end";
      
      default:
        return "requirements_gathering";
    }
  }

  /**
   * Requirements gathering node
   */
  private async requirementsGatheringNode(state: typeof FuneralPlanningState.State) {
    console.log("[Requirements] Gathering family requirements");
    
    return {
      planningStage: PlanningStage.CULTURAL_ASSESSMENT,
      currentAgent: "requirements_gatherer",
      messages: [
        new AIMessage({
          content: "Requirements gathering completed. Proceeding to cultural assessment.",
        }),
      ],
    };
  }

  /**
   * Cultural assessment node
   */
  private async culturalAssessmentNode(state: typeof FuneralPlanningState.State) {
    console.log("[Cultural] Assessing cultural and religious requirements");
    
    return {
      planningStage: PlanningStage.DOCUMENT_COLLECTION,
      currentAgent: "cultural_assessor",
      messages: [
        new AIMessage({
          content: "Cultural assessment completed. Proceeding to document collection.",
        }),
      ],
    };
  }

  /**
   * Document collection node
   */
  private async documentCollectionNode(state: typeof FuneralPlanningState.State) {
    console.log("[Documents] Managing document collection and verification");
    
    return {
      planningStage: PlanningStage.VENUE_SELECTION,
      currentAgent: "document_collector",
      messages: [
        new AIMessage({
          content: "Document collection in progress. Checking completion status.",
        }),
      ],
    };
  }

  /**
   * Venue selection node
   */
  private async venueSelectionNode(state: typeof FuneralPlanningState.State) {
    console.log("[Venue] Processing venue selection");
    
    return {
      planningStage: PlanningStage.SERVICE_PLANNING,
      currentAgent: "venue_selector",
      messages: [
        new AIMessage({
          content: "Venue selection completed. Proceeding to service planning.",
        }),
      ],
    };
  }

  /**
   * Service planning node
   */
  private async servicePlanningNode(state: typeof FuneralPlanningState.State) {
    console.log("[Service] Planning service details");
    
    return {
      planningStage: PlanningStage.APPROVAL_PROCESS,
      currentAgent: "service_planner",
      messages: [
        new AIMessage({
          content: "Service planning completed. Awaiting approvals.",
        }),
      ],
    };
  }

  /**
   * Approval process node - triggers human-in-the-loop
   */
  private async approvalProcessNode(state: typeof FuneralPlanningState.State) {
    console.log("[Approval] Processing approvals");
    
    // Add pending decisions for human review
    const pendingDecisions = [
      {
        type: "service_approval",
        description: "Final service details require family approval",
        data: state.serviceDetails,
      },
      {
        type: "cost_approval",
        description: "Total cost estimate requires approval",
        data: { /* cost breakdown */ },
      },
    ];

    return {
      planningStage: PlanningStage.COORDINATION,
      currentAgent: "approval_processor",
      pendingDecisions,
      messages: [
        new AIMessage({
          content: "Approval process initiated. Human review required.",
        }),
      ],
    };
  }

  /**
   * Coordination node
   */
  private async coordinationNode(state: typeof FuneralPlanningState.State) {
    console.log("[Coordination] Final coordination and scheduling");
    
    return {
      planningStage: PlanningStage.COMPLETED,
      currentAgent: "coordinator",
      messages: [
        new AIMessage({
          content: "Funeral planning coordination completed successfully.",
        }),
      ],
    };
  }

  /**
   * Human review node - implements human-in-the-loop pattern
   */
  private async humanReviewNode(state: typeof FuneralPlanningState.State) {
    console.log("[Human Review] Waiting for human input");
    
    // This node will interrupt the workflow for human input
    // Implementation will depend on the UI integration
    
    return {
      currentAgent: "human_reviewer",
      messages: [
        new AIMessage({
          content: "Human review required. Workflow paused for input.",
        }),
      ],
    };
  }

  /**
   * Error handler node
   */
  private async errorHandlerNode(state: typeof FuneralPlanningState.State) {
    console.log("[Error Handler] Processing errors");
    
    const errors = state.errors || [];
    
    return {
      planningStage: PlanningStage.ERROR,
      currentAgent: "error_handler",
      messages: [
        new AIMessage({
          content: `Error handling initiated. ${errors.length} errors to resolve.`,
        }),
      ],
    };
  }

  /**
   * Get the compiled graph
   */
  public getGraph() {
    return this.graph;
  }

  /**
   * Execute the workflow
   */
  public async execute(input: any, config?: any) {
    return await this.graph.invoke(input, config);
  }

  /**
   * Stream the workflow execution
   */
  public async stream(input: any, config?: any) {
    return this.graph.stream(input, config);
  }
}

// Export default instance
export const funeralOrchestrator = new FuneralPlanningOrchestrator();