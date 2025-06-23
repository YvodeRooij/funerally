import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages"
import { StateGraph, Annotation, START, END } from "@langchain/langgraph"

// Define the agent state
const FuneralPlanningAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentStep: Annotation<number>(),
  stepName: Annotation<string>(),
  formData: Annotation<any>(),
  intakeId: Annotation<string | undefined>(),
})

type FuneralPlanningState = typeof FuneralPlanningAnnotation.State

// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB1JpL7VY56A5td_P5Y692AzB2q5TIRTWw",
  temperature: 0.3,
  streaming: true,
})

// System prompt for funeral planning context
const FUNERAL_PLANNING_SYSTEM_PROMPT = `Je bent een empathische AI-assistent voor uitvaartplanning in een chat widget. Geef korte, praktische antwoorden.

BELANGRIJKSTE REGEL: Houd antwoorden KORT (max 2-3 zinnen).

ANTWOORD FORMAAT:
- 1 zin empathie/begrip
- 1-2 zinnen praktisch advies  
- Optioneel: 1 korte vervolgvraag

STIJL:
- Warm maar beknopt
- Direct en actionable
- Nederlands
- Geen lange uitleg
- Gebruik bullet points voor opsommingen

CONTEXT: 5-staps intake formulier (Overledene Info, Type Uitvaart, Locatie, Financiën, Speciale Wensen).

VOORBEELD GOED: "Ik begrijp dat dit moeilijk is. U kunt een schatting invullen - dit kan later aangepast worden. Heeft u andere vragen?"

VOORBEELD FOUT: [Lange paragrafen met veel uitleg]`

// Create the agent function
async function funeralPlanningAgent(state: FuneralPlanningState): Promise<{ messages: BaseMessage[] }> {
  const { messages, currentStep, stepName, formData } = state
  
  // Create context about current step
  const stepContext = getStepContext(currentStep, stepName, formData)
  
  // Prepare messages with system prompt and context
  const systemMessage = new SystemMessage(
    FUNERAL_PLANNING_SYSTEM_PROMPT + `\n\nHUIDIGE CONTEXT:\n${stepContext}`
  )
  
  const allMessages = [systemMessage, ...messages]
  
  // Get response from Gemini
  const response = await model.invoke(allMessages)
  
  // Ensure response is concise (max 200 characters for chat widget)
  let content = response.content as string
  if (content.length > 300) {
    // If too long, try to cut at sentence boundary
    const sentences = content.split(/[.!?]+/)
    if (sentences.length > 1) {
      content = sentences.slice(0, 2).join('.') + '.'
    } else {
      content = content.substring(0, 297) + '...'
    }
  }
  
  return {
    messages: [{ ...response, content }]
  }
}

// Get context about current step
function getStepContext(currentStep: number, stepName: string, formData: any): string {
  const stepInfo = getStepInfo(currentStep)
  const formProgress = getFormProgress(formData)
  
  return `
HUIDIGE STAP: ${currentStep + 1}/5 - ${stepName}
STAP BESCHRIJVING: ${stepInfo.description}
VEELGESTELDE VRAGEN: ${stepInfo.commonQuestions.join(', ')}

FORMULIER VOORTGANG:
${formProgress}

HULP FOCUS: ${stepInfo.helpFocus}
  `.trim()
}

// Get step-specific information
function getStepInfo(step: number) {
  const steps = [
    {
      description: "Basisgegevens van de overledene zoals naam, geboortedatum, overlijdensdatum en relatie tot de aanvrager",
      commonQuestions: [
        "Wat als ik de exacte datum niet weet?",
        "Welke documenten heb ik nodig?",
        "Hoe vul ik de relatie in?"
      ],
      helpFocus: "Documentatie en basisgegevens verzamelen"
    },
    {
      description: "Keuze tussen begrafenis, crematie of andere uitvaartvormen",
      commonQuestions: [
        "Wat is het verschil tussen begrafenis en crematie?",
        "Welke optie past bij onze tradities?",
        "Kan ik opties combineren?"
      ],
      helpFocus: "Uitleggen van verschillende uitvaartopties en hun implicaties"
    },
    {
      description: "Locatie voor de ceremonie en inschatting van het aantal gasten",
      commonQuestions: [
        "Hoe schat ik gasten in?",
        "Welke locaties zijn beschikbaar?",
        "Wat als ik de locatie nog niet weet?"
      ],
      helpFocus: "Praktische planning van ceremonie en ruimte"
    },
    {
      description: "Financiële aspecten zoals verzekering, budget en kostenraming",
      commonQuestions: [
        "Wat kosten verschillende opties?",
        "Hoe controleer ik mijn verzekering?",
        "Welke financiële hulp is beschikbaar?"
      ],
      helpFocus: "Transparantie over kosten en financiële planning"
    },
    {
      description: "Bijzondere wensen, culturele tradities en persoonlijke voorkeuren",
      commonQuestions: [
        "Hoe combineer ik tradities?",
        "Wat zijn mogelijke speciale wensen?",
        "Hoe communiceer ik religieuze vereisten?"
      ],
      helpFocus: "Personalisatie en respecteren van unieke wensen"
    }
  ]
  
  return steps[step] || steps[0]
}

// Get form progress summary
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

// Create the graph
const workflow = new StateGraph(FuneralPlanningAnnotation)
  .addNode("agent", funeralPlanningAgent)
  .addEdge(START, "agent")
  .addEdge("agent", END)

const app = workflow.compile()

// Export the agent
export { app as funeralPlanningAgent, type FuneralPlanningState }

// Helper function to create agent response
export async function getFuneralPlanningResponse(
  userMessage: string,
  currentStep: number,
  stepName: string,
  formData: any,
  intakeId?: string,
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
      intakeId
    }
    
    const result = await app.invoke({
      messages: allMessages,
      currentStep,
      stepName,
      formData,
      intakeId
    })
    
    // Return the last message content
    const lastMessage = result.messages[result.messages.length - 1]
    return lastMessage.content as string
    
  } catch (error) {
    console.error('Error in funeral planning agent:', error)
    
    // Fallback response
    return `Excuses, ik ondervind momenteel technische problemen. Ik ben hier om u te helpen met "${stepName}". Kunt u uw vraag opnieuw stellen? Als dit probleem aanhoudt, kunt u ook direct contact opnemen met onze klantenservice.`
  }
}