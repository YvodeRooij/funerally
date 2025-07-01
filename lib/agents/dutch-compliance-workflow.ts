/**
 * Dutch Legal Compliance LangGraph Workflow Integration
 * 
 * Integrates Dutch legal compliance with the main funeral planning workflows
 */

import { StateGraph, Annotation, interrupt, Command } from "@langchain/langgraph"
import { dutchLegalComplianceAgent } from './dutch-legal-compliance'
import { FuneralPlanningState } from './funeral-planning-agent'

// Extended state that includes Dutch compliance
export const DutchComplianceFuneralState = Annotation.Root({
  // Inherit from existing funeral planning state
  funeralRequest: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  
  // Dutch compliance specific state
  dutchCompliance: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({
      isInitialized: false,
      complianceStatus: 'not_started',
      legalDeadline: null,
      daysRemaining: null,
      alerts: [],
      emergencyTriggered: false
    }),
  }),
  
  // Workflow control
  currentStep: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => 'initial',
  }),
  
  // Actions and decisions
  actions: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  
  // Error handling
  errors: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
})

/**
 * Initialize Dutch legal compliance for a funeral request
 */
async function initializeDutchCompliance(state: typeof DutchComplianceFuneralState.State) {
  console.log('🇳🇱 Initializing Dutch legal compliance...')
  
  try {
    const funeralRequest = state.funeralRequest
    
    if (!funeralRequest?.id) {
      return {
        errors: ['Funeral request ID is required for Dutch compliance'],
        currentStep: 'error'
      }
    }
    
    if (!funeralRequest?.deathRegistrationDate) {
      return {
        errors: ['Death registration date is required for Dutch compliance'],
        currentStep: 'error'
      }
    }
    
    // Initialize compliance tracking
    const complianceContext = await dutchLegalComplianceAgent.processCompliance(
      funeralRequest.id,
      new Date(funeralRequest.deathRegistrationDate)
    )
    
    // Generate initial alerts
    const alerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)
    
    return {
      dutchCompliance: {
        isInitialized: true,
        complianceStatus: complianceContext.complianceStatus,
        legalDeadline: complianceContext.legalDeadline,
        daysRemaining: complianceContext.deadlineDaysRemaining,
        alerts,
        emergencyTriggered: complianceContext.emergencyProtocolTriggered
      },
      actions: ['dutch_compliance_initialized'],
      currentStep: 'compliance_monitoring'
    }
    
  } catch (error) {
    console.error('Error initializing Dutch compliance:', error)
    return {
      errors: [`Failed to initialize Dutch compliance: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentStep: 'error'
    }
  }
}

/**
 * Monitor Dutch legal compliance status
 */
async function monitorDutchCompliance(state: typeof DutchComplianceFuneralState.State) {
  console.log('👀 Monitoring Dutch legal compliance...')
  
  try {
    const funeralRequest = state.funeralRequest
    
    if (!funeralRequest?.id) {
      return {
        errors: ['Funeral request ID is required for monitoring'],
        currentStep: 'error'
      }
    }
    
    // Check current compliance status
    const complianceContext = await dutchLegalComplianceAgent.monitorCompliance(funeralRequest.id)
    const alerts = dutchLegalComplianceAgent.generateAlerts(complianceContext)
    
    const updatedCompliance = {
      ...state.dutchCompliance,
      complianceStatus: complianceContext.complianceStatus,
      daysRemaining: complianceContext.deadlineDaysRemaining,
      alerts,
      emergencyTriggered: complianceContext.emergencyProtocolTriggered,
      lastChecked: new Date().toISOString()
    }
    
    // Determine next step based on compliance status
    let nextStep = 'continue_planning'
    
    if (complianceContext.complianceStatus === 'emergency') {
      nextStep = 'emergency_protocol'
    } else if (complianceContext.complianceStatus === 'at_risk') {
      nextStep = 'urgent_action_required'
    } else if (complianceContext.complianceStatus === 'in_progress') {
      nextStep = 'accelerated_planning'
    }
    
    return {
      dutchCompliance: updatedCompliance,
      actions: ['compliance_status_checked'],
      currentStep: nextStep
    }
    
  } catch (error) {
    console.error('Error monitoring Dutch compliance:', error)
    return {
      errors: [`Failed to monitor Dutch compliance: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentStep: 'error'
    }
  }
}

/**
 * Handle emergency protocol activation
 */
async function handleEmergencyProtocol(state: typeof DutchComplianceFuneralState.State) {
  console.log('🚨 ACTIVATING EMERGENCY PROTOCOL')
  
  try {
    const funeralRequest = state.funeralRequest
    
    // Log emergency activation
    console.log(`🚨 EMERGENCY: Legal deadline exceeded for funeral ${funeralRequest.id}`)
    
    // Generate emergency actions
    const emergencyActions = [
      'contact_municipality_immediately',
      'request_emergency_extension',
      'activate_emergency_funeral_protocol',
      'notify_all_stakeholders',
      'escalate_to_management'
    ]
    
    return {
      dutchCompliance: {
        ...state.dutchCompliance,
        emergencyTriggered: true,
        emergencyActivatedAt: new Date().toISOString()
      },
      actions: emergencyActions,
      currentStep: 'emergency_active'
    }
    
  } catch (error) {
    console.error('Error handling emergency protocol:', error)
    return {
      errors: [`Failed to handle emergency protocol: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentStep: 'error'
    }
  }
}

/**
 * Handle urgent action required
 */
async function handleUrgentAction(state: typeof DutchComplianceFuneralState.State) {
  console.log('⚠️ URGENT ACTION REQUIRED')
  
  const urgentActions = [
    'finalize_all_arrangements_immediately',
    'confirm_venue_and_time',
    'generate_all_required_documents',
    'send_final_confirmations'
  ]
  
  return {
    actions: urgentActions,
    currentStep: 'urgent_planning'
  }
}

/**
 * Handle accelerated planning
 */
async function handleAcceleratedPlanning(state: typeof DutchComplianceFuneralState.State) {
  console.log('🏃‍♂️ ACCELERATED PLANNING MODE')
  
  const acceleratedActions = [
    'confirm_all_major_decisions',
    'book_venue_if_not_done',
    'order_required_services',
    'prepare_documentation'
  ]
  
  return {
    actions: acceleratedActions,
    currentStep: 'accelerated_planning'
  }
}

/**
 * Check if compliance monitoring should continue
 */
function shouldContinueMonitoring(state: typeof DutchComplianceFuneralState.State): string {
  const compliance = state.dutchCompliance
  
  if (!compliance?.isInitialized) {
    return 'initialize_compliance'
  }
  
  if (compliance.emergencyTriggered) {
    return 'emergency_protocol'
  }
  
  if (compliance.complianceStatus === 'emergency') {
    return 'emergency_protocol'
  }
  
  if (compliance.complianceStatus === 'at_risk') {
    return 'urgent_action'
  }
  
  if (compliance.complianceStatus === 'in_progress') {
    return 'accelerated_planning'
  }
  
  return 'continue_planning'
}

/**
 * Create the Dutch Compliance Workflow
 */
export function createDutchComplianceWorkflow() {
  const workflow = new StateGraph(DutchComplianceFuneralState)
    
    // Core compliance nodes
    .addNode("initialize_compliance", initializeDutchCompliance)
    .addNode("monitor_compliance", monitorDutchCompliance)
    .addNode("emergency_protocol", handleEmergencyProtocol)
    .addNode("urgent_action", handleUrgentAction)
    .addNode("accelerated_planning", handleAcceleratedPlanning)
    
    // Entry point
    .addEdge("__start__", "initialize_compliance")
    
    // Conditional routing based on compliance status
    .addConditionalEdges(
      "initialize_compliance",
      shouldContinueMonitoring,
      {
        "emergency_protocol": "emergency_protocol",
        "urgent_action": "urgent_action",
        "accelerated_planning": "accelerated_planning",
        "continue_planning": "monitor_compliance",
        "error": "__end__"
      }
    )
    
    .addConditionalEdges(
      "monitor_compliance",
      shouldContinueMonitoring,
      {
        "emergency_protocol": "emergency_protocol",
        "urgent_action": "urgent_action",
        "accelerated_planning": "accelerated_planning",
        "continue_planning": "__end__",
        "error": "__end__"
      }
    )
    
    // Emergency protocol paths
    .addEdge("emergency_protocol", "__end__")
    .addEdge("urgent_action", "__end__")
    .addEdge("accelerated_planning", "__end__")

  return workflow.compile()
}

/**
 * Integration helper to add Dutch compliance to existing workflows
 */
export async function addDutchComplianceToWorkflow(
  funeralRequestId: string,
  deathRegistrationDate: Date,
  existingState: any = {}
) {
  console.log('🔗 Integrating Dutch legal compliance with existing workflow...')
  
  const dutchWorkflow = createDutchComplianceWorkflow()
  
  const initialState = {
    funeralRequest: {
      id: funeralRequestId,
      deathRegistrationDate: deathRegistrationDate.toISOString(),
      ...existingState
    },
    dutchCompliance: {
      isInitialized: false,
      complianceStatus: 'not_started'
    },
    currentStep: 'initial',
    actions: [],
    errors: []
  }
  
  try {
    const result = await dutchWorkflow.invoke(initialState)
    
    console.log('✅ Dutch compliance workflow completed')
    console.log(`Final status: ${result.dutchCompliance?.complianceStatus}`)
    console.log(`Actions generated: ${result.actions?.length || 0}`)
    
    return result
    
  } catch (error) {
    console.error('❌ Dutch compliance workflow failed:', error)
    throw error
  }
}

// Export the main workflow
export const dutchComplianceWorkflow = createDutchComplianceWorkflow()