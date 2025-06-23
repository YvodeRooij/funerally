import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getServiceSupabaseClient } from "@/lib/supabase"

// Enhanced report generation agent using LangGraph JS + Gemini
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-exp",
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB1JpL7VY56A5td_P5Y692AzB2q5TIRTWw",
  temperature: 0.2, // Lower temperature for more consistent reports
})

const REPORT_GENERATION_PROMPT = `Je bent een professionele AI-analist gespecialiseerd in uitvaartplanning rapportage. Je genereert uitgebreide, empathische rapporten voor uitvaartondernemers.

DOEL: Creëer een professioneel rapport dat uitvaartondernemers helpt de familie optimaal te begeleiden.

RAPPORTSTRUCTUUR:
1. **Familiesituatie Overzicht**
   - Basisgegevens overledene
   - Familierelaties en contactpersoon
   - Emotionele context uit gesprekken

2. **Uitvaartwensen Analyse**
   - Gewenste uitvaarttype (begrafenis/crematie)
   - Locatie voorkeuren
   - Culturele/religieuze vereisten
   - Speciale wensen

3. **Praktische Planning**
   - Geschat aantal gasten
   - Budget indicatie en financiële situatie
   - Tijdslijn voorkeuren
   - Logistieke overwegingen

4. **Communicatie Profiel**
   - Hoe de familie communiceert (uit chat analyse)
   - Besluitvormingspatroon
   - Emotionele behoeften en ondersteuning
   - Voorkeur voor contact (telefoon/email/persoonlijk)

5. **Aanbevelingen voor Uitvaartondernemer**
   - Aanpak suggesties gebaseerd op familieprofiel
   - Prioriteiten in service verlening
   - Potentiële aandachtspunten
   - Volgende stappen advies

STIJL:
- Professioneel maar empathisch
- Respectvol en waardig
- Praktisch en actionable
- Gebaseerd op feiten uit intake en gesprekken

BELANGRIJK:
- Gebruik alleen informatie uit de intake data en chat geschiedenis
- Wees specifiek over voorkeuren die naar voren kwamen
- Geef concrete aanbevelingen voor de uitvaartondernemer
- Respecteer gevoeligheid van de situatie`

interface ReportInput {
  intakeData: any
  chatHistory: any[]
  userProfile: any
}

interface ReportAnalysis {
  familySituation: string
  funeralPreferences: string
  practicalPlanning: string
  communicationProfile: string
  directorRecommendations: string
  summary: string
  urgencyLevel: 'low' | 'medium' | 'high'
  preferredContact: 'phone' | 'email' | 'in_person'
}

export async function generateComprehensiveReport(input: ReportInput): Promise<ReportAnalysis> {
  const { intakeData, chatHistory, userProfile } = input

  // Prepare analysis context
  const analysisContext = `
INTAKE FORMULIER DATA:
${JSON.stringify(intakeData, null, 2)}

CHAT GESPREKKEN ANALYSE:
${chatHistory.map((msg, i) => 
  `${i + 1}. ${msg.type}: ${msg.message} (${new Date(msg.created_at).toLocaleDateString('nl-NL')})`
).join('\n')}

GEBRUIKER PROFIEL:
${JSON.stringify(userProfile, null, 2)}

VRAAG: Analyseer bovenstaande informatie en genereer een uitgebreid rapport volgens de opgegeven structuur.
  `

  const messages = [
    new SystemMessage(REPORT_GENERATION_PROMPT),
    new HumanMessage(analysisContext)
  ]

  try {
    const response = await model.invoke(messages)
    const reportContent = response.content as string

    // Extract structured insights for dashboard/automation
    const analysis = await extractStructuredInsights(reportContent, intakeData)

    return analysis

  } catch (error) {
    console.error('Error generating comprehensive report:', error)
    throw new Error('Failed to generate report')
  }
}

async function extractStructuredInsights(
  reportContent: string, 
  intakeData: any
): Promise<ReportAnalysis> {
  // Use AI to extract structured data from the report
  const structurePrompt = `
Analyseer het volgende rapport en extraheer gestructureerde inzichten:

RAPPORT:
${reportContent}

INTAKE DATA:
${JSON.stringify(intakeData, null, 2)}

Geef terug in het volgende JSON formaat:
{
  "familySituation": "Beknopte samenvatting van de familiesituatie",
  "funeralPreferences": "Belangrijkste uitvaartwensen",
  "practicalPlanning": "Praktische planning details",
  "communicationProfile": "Hoe deze familie communiceert en benaderd wil worden",
  "directorRecommendations": "Specifieke aanbevelingen voor de uitvaartondernemer",
  "summary": "Executive summary van het hele rapport",
  "urgencyLevel": "low|medium|high gebaseerd op timing en emotionele state",
  "preferredContact": "phone|email|in_person gebaseerd op communicatiestijl"
}
  `

  const structureMessages = [
    new SystemMessage("Je bent een data-analist die rapporten omzet naar gestructureerde JSON."),
    new HumanMessage(structurePrompt)
  ]

  try {
    const structureResponse = await model.invoke(structureMessages)
    const jsonString = structureResponse.content as string
    
    // Extract JSON from response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        fullReport: reportContent // Include full report
      }
    }

    // Fallback if JSON parsing fails
    return createFallbackAnalysis(reportContent, intakeData)

  } catch (error) {
    console.error('Error extracting structured insights:', error)
    return createFallbackAnalysis(reportContent, intakeData)
  }
}

function createFallbackAnalysis(reportContent: string, intakeData: any): ReportAnalysis {
  return {
    familySituation: `Familie van ${intakeData.deceasedName || 'onbekend'}, contactpersoon: ${intakeData.relationship || 'onbekend'}`,
    funeralPreferences: intakeData.serviceType || 'Niet gespecificeerd',
    practicalPlanning: `Geschat ${intakeData.estimatedGuests || 'onbekend'} gasten, budget: €${intakeData.budget || 'niet opgegeven'}`,
    communicationProfile: 'Communicatieprofiel gebaseerd op chat interacties',
    directorRecommendations: 'Empathische benadering aanbevolen, respecteer timing van de familie',
    summary: reportContent.substring(0, 500) + '...',
    urgencyLevel: 'medium',
    preferredContact: 'phone'
  }
}

// Generate unique access code for directors
export function generateDirectorAccessCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `FNR-${timestamp}-${random}`.toUpperCase()
}

// Save report with director access
export async function saveReportWithDirectorAccess(
  reportAnalysis: ReportAnalysis,
  intakeId: string,
  familyUserId: string,
  directorCode?: string
): Promise<{ reportId: string, accessCode: string }> {
  const supabase = getServiceSupabaseClient()
  
  try {
    // Generate access code if not provided
    const accessCode = directorCode || generateDirectorAccessCode()
    
    // Save the comprehensive report
    const { data: report, error: reportError } = await supabase
      .from('intake_reports')
      .insert({
        intake_id: intakeId,
        user_id: familyUserId,
        report_type: 'comprehensive_analysis',
        report_data: {
          analysis: reportAnalysis,
          generated_at: new Date().toISOString(),
          version: '2.0'
        },
        is_encrypted: true,
        access_code: accessCode,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) throw reportError

    // Create director access record
    const { error: accessError } = await supabase
      .from('report_access')
      .insert({
        report_id: report.id,
        access_code: accessCode,
        access_type: 'director_view',
        granted_by: familyUserId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString()
      })

    if (accessError) throw accessError

    return {
      reportId: report.id,
      accessCode: accessCode
    }

  } catch (error) {
    console.error('Error saving report with director access:', error)
    throw new Error('Failed to save report')
  }
}

export type { ReportAnalysis, ReportInput }