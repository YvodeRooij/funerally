import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages"
import { getServiceSupabaseClient } from "@/lib/supabase"

// Initialize Gemini model for general assistance
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB1JpL7VY56A5td_P5Y692AzB2q5TIRTWw",
  temperature: 0.3,
})

// System prompt for general dashboard assistance
const DASHBOARD_HELPER_PROMPT = `Je bent een vriendelijke en behulpzame assistent voor families die een uitvaart moeten regelen. Je helpt met algemene vragen over het dashboard, documenten, processen en communicatie met uitvaartondernemers.

BELANGRIJKE REGELS:
- Geef korte, praktische antwoorden (max 2-3 zinnen)
- Wees empathisch maar zakelijk
- Focus op concrete hulp en duidelijke stappen
- Verwijs NIET naar jezelf als AI of digitale assistent
- Gebruik informele "je" vorm, niet "u"

CONTEXT KENNIS:
- Het dashboard heeft 6 stappen: Persoonlijke gegevens, Documenten uploaden, Uitvaartondernemer selecteren, Gegevens verzenden, Ceremonie plannen, Financiële afhandeling
- Vereiste documenten: Overlijdensakte, Identiteitsbewijs, Verzekeringspolis, Uittreksel GBA, Toestemmingsverklaring
- Families kunnen direct contact opnemen met hun uitvaartondernemer via telefoon of video
- Gegevens kunnen gewijzigd worden na verzending

VEELVOORKOMENDE VRAGEN:
1. "Hoe verzend ik mijn gegevens?" → Selecteer eerst een uitvaartondernemer, controleer je details, klik op "Verzend naar ondernemer"
2. "Welke documenten heb ik nodig?" → De 5 vereiste documenten (zie hierboven), alle in PDF/JPG/PNG format, max 10MB
3. "Hoe wijzig ik gegevens?" → Na verzending kun je op "Wijzigen" klikken, de ondernemer wordt automatisch geïnformeerd
4. "Contact met ondernemer?" → Gebruik de "Bellen" of "Video" knoppen in het dashboard

ANTWOORD STIJL:
- Begin met begrip tonen indien gepast
- Geef direct bruikbaar advies
- Eindig eventueel met een vraag om te verduidelijken

VOORBEELD:
Vraag: "Ik snap niet hoe ik mijn documenten moet uploaden"
Antwoord: "Bij stap 2 'Documenten uploaden' kun je bestanden slepen of op de knop klikken om ze te selecteren. Zorg dat het PDF, JPG of PNG bestanden zijn kleiner dan 10MB. Welk document geeft problemen?"`

interface HelperContext {
  topic?: string
  currentPage?: string
  userRole?: string
}

export async function getGeneralHelperResponse(
  message: string,
  context: HelperContext = {},
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    // Build conversation history
    const messages: BaseMessage[] = [
      new SystemMessage(DASHBOARD_HELPER_PROMPT),
    ]

    // Add chat history if available
    chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content))
      } else if (msg.role === 'assistant') {
        messages.push(new SystemMessage(msg.content))
      }
    })

    // Add context information if available
    let contextMessage = message
    if (context.topic) {
      contextMessage = `[Context: Vraag over ${context.topic}] ${message}`
    }
    if (context.currentPage) {
      contextMessage = `[Huidige pagina: ${context.currentPage}] ${contextMessage}`
    }

    messages.push(new HumanMessage(contextMessage))

    // Get response from model
    const response = await model.invoke(messages)
    
    return response.content.toString()
  } catch (error) {
    console.error('Error in general helper agent:', error)
    
    // Fallback response
    return "Excuses, er ging iets mis. Voor directe hulp kun je bellen naar 0800-1234567 (gratis, 24/7 bereikbaar)."
  }
}

// Helper functions for specific dashboard contexts
export async function getDashboardQuickHelp(topic: string): Promise<string> {
  const quickResponses: Record<string, string> = {
    "verzenden": "Om je gegevens te verzenden: selecteer eerst een uitvaartondernemer bij stap 3, controleer je details, en klik op 'Verzend naar ondernemer'. De ondernemer ontvangt direct een melding.",
    "documenten": "Je hebt 5 documenten nodig: Overlijdensakte, Identiteitsbewijs overledene, Verzekeringspolis, Uittreksel GBA, en Toestemmingsverklaring. Upload ze als PDF, JPG of PNG (max 10MB).",
    "wijzigen": "Na verzending kun je op 'Wijzigen' klikken. Je kunt dan aanpassingen maken en opnieuw verzenden. De uitvaartondernemer wordt automatisch op de hoogte gesteld.",
    "contact": "Je kunt direct contact opnemen via de 'Bellen' of 'Video' knoppen bij je uitvaartondernemer in het dashboard. Voor algemene vragen: 0800-1234567.",
    "status": "In het procesoverzicht zie je precies waar je bent. Groene vinkjes = voltooid, blauw = bezig, grijs = nog te doen.",
    "kosten": "Check je verzekeringsdekking bij stap 6. Je uitvaartondernemer helpt met de financiële afhandeling en verzekeringsclaims.",
  }

  return quickResponses[topic] || "Ik help je graag. Kun je je vraag iets specifieker maken?"
}

// Function to check if question is about general help or specific intake
export function isGeneralHelpQuestion(message: string, context: any): boolean {
  const intakeKeywords = ['intake', 'formulier', 'invullen', 'vragenlijst', 'stap 1', 'persoonlijke gegevens invullen']
  const generalKeywords = ['dashboard', 'verzenden', 'documenten', 'ondernemer', 'status', 'wijzigen', 'contact']
  
  const lowerMessage = message.toLowerCase()
  
  // If we're in the intake context, always use intake agent
  if (context.formData?.context === 'intake' || context.currentStep < 4) {
    return false
  }
  
  // Check for general dashboard keywords
  const hasGeneralKeyword = generalKeywords.some(keyword => lowerMessage.includes(keyword))
  const hasIntakeKeyword = intakeKeywords.some(keyword => lowerMessage.includes(keyword))
  
  // Use general helper for dashboard context
  return hasGeneralKeyword || (!hasIntakeKeyword && context.formData?.context === 'family_dashboard_help')
}