import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages"
import { StateGraph, Annotation, START, END } from "@langchain/langgraph"
import { getServiceSupabaseClient } from "@/lib/supabase"

// Define the agent state with MCP tools
const FuneralPlanningAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentStep: Annotation<number>(),
  stepName: Annotation<string>(),
  formData: Annotation<any>(),
  intakeId: Annotation<string | undefined>(),
  userId: Annotation<string | undefined>(),
  chatHistory: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
})

type FuneralPlanningState = typeof FuneralPlanningAnnotation.State

// Initialize Gemini model with tools
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ,
  temperature: 0.3,
  streaming: true,
})

// Enhanced system prompt with MCP context
const ENHANCED_SYSTEM_PROMPT = `Je bent een empathische AI-assistent voor uitvaartplanning met toegang tot de database. Geef korte, praktische antwoorden met echte data.

BELANGRIJKSTE REGEL: Houd antwoorden KORT (max 2-3 zinnen).

PAGINA ACCURAATHEID:
- ALLEEN refereren aan velden die daadwerkelijk op de huidige pagina staan
- Controleer "WAT STAAT ER OP DEZE PAGINA" sectie in context
- NOOIT een opmerkingenveld of andere niet-bestaande velden noemen
- Wees precies over welke keuzes/velden er zijn

DATABASE TOEGANG:
- Je kunt echte locaties, venues en diensten opzoeken
- Gebruik persoonlijke data van eerdere gesprekken  
- Alle gesprekken worden opgeslagen voor personalisatie

ANTWOORD FORMAAT:
- 1 zin empathie/begrip
- 1-2 zinnen praktisch advies met echte data/velden
- Optioneel: 1 korte vervolgvraag

STIJL:
- Warm maar beknopt
- Gebruik echte locaties/prijzen als beschikbaar
- Verwijs naar eerdere gesprekken indien relevant
- Nederlands

VOORBEELD GOED: "Ik begrijp dat dit lastig is. Vul een schatting in voor de datum - dit kan later aangepast worden. Welke relatie heeft u tot de overledene?"

VOORBEELD FOUT: "Noteer in het opmerkingenveld..." (er IS geen opmerkingenveld!)

⚠️ BELANGRIJK: Deze gesprekken worden opgeslagen om u later een meer persoonlijke ervaring te bieden.`

// MCP Tool Functions for database queries
class FuneralPlanningTools {
  private supabase = getServiceSupabaseClient()

  // Get available venues/locations
  async getAvailableVenues(area?: string, type?: string) {
    try {
      let query = this.supabase
        .from('venues')
        .select('name, location, venue_type, capacity, price_per_hour')
        .eq('active', true)
        .limit(3)

      if (area) {
        query = query.ilike('location', `%${area}%`)
      }
      if (type) {
        query = query.eq('venue_type', type)
      }

      const { data, error } = await query
      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching venues:', error)
      return []
    }
  }

  // Get burial/cremation options with pricing
  async getFuneralOptions(type?: 'burial' | 'cremation') {
    try {
      const { data, error } = await this.supabase
        .from('funeral_services')
        .select('name, type, description, price_range_min, price_range_max, provider')
        .eq('active', true)
        .eq(type ? 'type' : 'id', type || 'id')
        .limit(3)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching funeral options:', error)
      return []
    }
  }

  // Get user's conversation history for personalization
  async getUserChatHistory(intakeId: string, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('intake_chat_history')
        .select('message, type, context, created_at')
        .eq('intake_id', intakeId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching chat history:', error)
      return []
    }
  }

  // Save conversation for future personalization
  async saveChatMessage(intakeId: string, message: string, type: 'user' | 'assistant', context: any) {
    try {
      const { error } = await this.supabase
        .from('intake_chat_history')
        .insert({
          intake_id: intakeId,
          message,
          type,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            saved_for_personalization: true
          },
          created_at: new Date().toISOString()
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving chat message:', error)
      return false
    }
  }
}

// Enhanced agent function with MCP tools
async function enhancedFuneralPlanningAgent(state: FuneralPlanningState): Promise<{ messages: BaseMessage[] }> {
  const { messages, currentStep, stepName, formData, intakeId, userId } = state
  const tools = new FuneralPlanningTools()
  
  // Create context about current step with data access
  const stepContext = await getEnhancedStepContext(currentStep, stepName, formData, tools, intakeId)
  
  // Get previous conversation context for personalization
  let conversationContext = ""
  if (intakeId) {
    const history = await tools.getUserChatHistory(intakeId, 3)
    if (history.length > 0) {
      conversationContext = `\n\nVOORIGE GESPREKKEN:\n${history.map(h => 
        `${h.type}: ${h.message}`
      ).join('\n')}`
    }
  }
  
  // Prepare messages with enhanced system prompt and context
  const systemMessage = new SystemMessage(
    ENHANCED_SYSTEM_PROMPT + `\n\nHUIDIGE CONTEXT:\n${stepContext}${conversationContext}`
  )
  
  const allMessages = [systemMessage, ...messages]
  
  // Get response from Gemini
  const response = await model.invoke(allMessages)
  
  // Ensure response is concise and save conversation
  let content = response.content as string
  if (content.length > 300) {
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 1) {
      content = sentences.slice(0, 2).join('.') + '.'
    } else {
      content = content.substring(0, 297) + '...'
    }
  }

  // Save this conversation for future personalization
  if (intakeId && messages.length > 0) {
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage.getType() === 'human') {
      await tools.saveChatMessage(
        intakeId,
        lastUserMessage.content as string,
        'user',
        { step: currentStep, stepName }
      )
      await tools.saveChatMessage(
        intakeId,
        content,
        'assistant',
        { step: currentStep, stepName, used_database: true }
      )
    }
  }
  
  return {
    messages: [{ ...response, content }]
  }
}

// Enhanced step context with real data
async function getEnhancedStepContext(
  currentStep: number, 
  stepName: string, 
  formData: any, 
  tools: FuneralPlanningTools,
  intakeId?: string
): Promise<string> {
  const stepInfo = getStepInfo(currentStep)
  const formProgress = getFormProgress(formData)
  
  // Get relevant data based on current step
  let dataContext = ""
  
  switch (currentStep) {
    case 1: // Type Uitvaart
      const funeralOptions = await tools.getFuneralOptions()
      if (funeralOptions.length > 0) {
        dataContext = `\nBESCHIKBARE OPTIES:\n${funeralOptions.map(o => 
          `- ${o.name}: €${o.price_range_min}-${o.price_range_max}`
        ).join('\n')}`
      }
      break
      
    case 2: // Locatie & Gasten  
      const venues = await tools.getAvailableVenues()
      if (venues.length > 0) {
        dataContext = `\nBESCHIKBARE LOCATIES:\n${venues.map(v => 
          `- ${v.name} (${v.location}): ${v.capacity} personen, €${v.price_per_hour}/uur`
        ).join('\n')}`
      }
      break
  }
  
  return `
HUIDIGE STAP: ${currentStep + 1}/5 - ${stepName}
STAP BESCHRIJVING: ${stepInfo.description}

WAT STAAT ER OP DEZE PAGINA:
${stepInfo.actualFields ? stepInfo.actualFields.map(field => `- ${field}`).join('\n') : 'Geen veldinformatie beschikbaar'}

VEELGESTELDE VRAGEN: ${stepInfo.commonQuestions.join(', ')}

FORMULIER VOORTGANG:
${formProgress}

${dataContext}

HULP FOCUS: ${stepInfo.helpFocus}

💾 Dit gesprek wordt opgeslagen voor personalisatie.
  `.trim()
}

// Rest of helper functions remain the same...
function getStepInfo(step: number) {
  const steps = [
    {
      description: "Basisgegevens van de overledene zoals naam, overlijdensdatum en relatie tot de aanvrager",
      actualFields: ["Naam van de overledene (tekstveld)", "Datum van overlijden (datumveld)", "Uw relatie tot de overledene (keuzerondje: Partner/echtgenoot, Kind, Ouder, Broer/zus, Anders)"],
      commonQuestions: ["Wat als ik de exacte datum niet weet?", "Welke relatie moet ik kiezen?"],
      helpFocus: "Invullen van naam, datum en relatie - GEEN opmerkingenveld aanwezig"
    },
    {
      description: "Keuze tussen begrafenis, crematie of andere uitvaartvormen",
      actualFields: ["Type uitvaart selecteren", "Voorkeur aangeven"],
      commonQuestions: ["Wat is het verschil tussen begrafenis en crematie?", "Welke optie past bij ons?"],
      helpFocus: "Uitleggen van verschillende uitvaartopties met echte prijzen uit database"
    },
    {
      description: "Locatie voor de ceremonie en inschatting van het aantal gasten",
      actualFields: ["Locatie voorkeur", "Aantal gasten", "Speciale wensen locatie"],
      commonQuestions: ["Hoe schat ik gasten in?", "Welke locaties zijn beschikbaar?"],
      helpFocus: "Praktische planning van ceremonie met echte beschikbare locaties"
    },
    {
      description: "Financiële aspecten zoals verzekering, budget en kostenraming",
      actualFields: ["Verzekeringsinformatie", "Budget indicatie", "Financiële voorkeur"],
      commonQuestions: ["Wat kosten verschillende opties?", "Hoe controleer ik mijn verzekering?"],
      helpFocus: "Transparantie over kosten met echte prijzen uit database"
    },
    {
      description: "Bijzondere wensen, culturele tradities en persoonlijke voorkeuren",
      actualFields: ["Culturele tradities", "Religieuze wensen", "Speciale verzoeken"],
      commonQuestions: ["Hoe combineer ik tradities?", "Wat zijn mogelijke speciale wensen?"],
      helpFocus: "Personalisatie en respecteren van unieke wensen"
    }
  ]
  
  return steps[step] || steps[0]
}

function getFormProgress(formData: any): string {
  if (!formData) return "Geen formulierdata beschikbaar"
  
  const progress = []
  if (formData.deceasedName) progress.push(`Naam: ${formData.deceasedName}`)
  if (formData.serviceType) progress.push(`Type: ${formData.serviceType}`)
  if (formData.location) progress.push(`Locatie: ${formData.location}`)
  if (formData.estimatedGuests) progress.push(`Gasten: ${formData.estimatedGuests}`)
  if (formData.budget) progress.push(`Budget: €${formData.budget}`)
  
  return progress.length > 0 ? progress.join('\n') : "Formulier nog niet ingevuld"
}

// Create the enhanced graph
const enhancedWorkflow = new StateGraph(FuneralPlanningAnnotation)
  .addNode("agent", enhancedFuneralPlanningAgent)
  .addEdge(START, "agent")
  .addEdge("agent", END)

const enhancedApp = enhancedWorkflow.compile()

// Export the enhanced agent
export { enhancedApp as enhancedFuneralPlanningAgent, type FuneralPlanningState }

// Helper function to create enhanced agent response
export async function getEnhancedFuneralPlanningResponse(
  userMessage: string,
  currentStep: number,
  stepName: string,
  formData: any,
  intakeId?: string,
  userId?: string,
  chatHistory: BaseMessage[] = []
): Promise<string> {
  try {
    const userMsg = new HumanMessage(userMessage)
    const allMessages = [...chatHistory, userMsg]
    
    const state: FuneralPlanningState = {
      messages: allMessages,
      currentStep,
      stepName,
      formData,
      intakeId,
      userId,
      chatHistory: []
    }
    
    const result = await enhancedApp.invoke(state)
    
    // Return the last message content
    const lastMessage = result.messages[result.messages.length - 1]
    return lastMessage.content as string
    
  } catch (error) {
    console.error('Error in enhanced funeral planning agent:', error)
    
    // Fallback response
    return `Excuses, ik ondervind momenteel technische problemen. Ik ben hier om u te helpen met "${stepName}". Kunt u uw vraag opnieuw stellen?`
  }
}