import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages"
import { getAgentPrompts, AgentPrompts, COUNTRY_CONFIGS, CountryConfig } from './prompts'

// Base configuration for all dashboard helper agents
export interface HelperAgentConfig {
  userType: 'family' | 'director' | 'venue'
  locale?: string
  temperature?: number
  modelName?: string
}

export interface HelperContext {
  topic?: string
  currentPage?: string
  userRole?: string
  [key: string]: any
}

// Base class for all dashboard helper agents
export abstract class BaseDashboardHelper {
  protected model: ChatGoogleGenerativeAI
  protected config: HelperAgentConfig
  protected prompts: AgentPrompts
  protected countryConfig: CountryConfig
  protected locale: string

  constructor(config: HelperAgentConfig) {
    this.config = config
    this.locale = config.locale || 'nl'
    
    // Get localized prompts
    this.prompts = getAgentPrompts(config.userType, this.locale)
    
    // Get country-specific config
    this.countryConfig = COUNTRY_CONFIGS[this.locale] || COUNTRY_CONFIGS['nl']
    
    this.model = new ChatGoogleGenerativeAI({
      model: config.modelName || "gemini-2.0-flash-exp",
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyB1JpL7VY56A5td_P5Y692AzB2q5TIRTWw",
      temperature: config.temperature || 0.3,
    })
  }

  async getResponse(
    message: string,
    context: HelperContext = {},
    chatHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    try {
      // Debug logging
      console.log(`Helper agent invoked - Type: ${this.config.userType}, Locale: ${this.locale}`)
      
      // Add country context to system prompt (language-aware labels)
      const contextLabels = {
        nl: {
          header: 'LAND SPECIFIEKE CONTEXT:',
          emergency: 'Noodlijn',
          support: 'Support email',
          currency: 'Valuta',
          dateFormat: 'Datum formaat'
        },
        en: {
          header: 'COUNTRY SPECIFIC CONTEXT:',
          emergency: 'Emergency line',
          support: 'Support email',
          currency: 'Currency',
          dateFormat: 'Date format'
        }
      }
      
      const labels = contextLabels[this.locale] || contextLabels.nl
      
      const contextualizedPrompt = this.prompts.systemPrompt + 
        `\n\n${labels.header}\n` +
        `- ${labels.emergency}: ${this.countryConfig.emergencyNumber}\n` +
        `- ${labels.support}: ${this.countryConfig.supportEmail}\n` +
        `- ${labels.currency}: ${this.countryConfig.currency}\n` +
        `- ${labels.dateFormat}: ${this.countryConfig.dateFormat}`
      
      const messages: BaseMessage[] = [
        new SystemMessage(contextualizedPrompt),
      ]

      // Add chat history
      chatHistory.forEach(msg => {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content))
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content))
        }
      })

      // Add context information
      let contextMessage = message
      if (context.topic) {
        contextMessage = `[Context: Vraag over ${context.topic}] ${message}`
      }
      if (context.currentPage) {
        contextMessage = `[Huidige pagina: ${context.currentPage}] ${contextMessage}`
      }

      messages.push(new HumanMessage(contextMessage))

      // Get response from model
      const response = await this.model.invoke(messages)
      
      return response.content.toString()
    } catch (error) {
      console.error(`Error in ${this.config.userType} helper agent:`, error)
      console.error('Locale:', this.locale)
      console.error('Fallback response:', this.prompts.fallbackResponse)
      return this.getFallbackResponse()
    }
  }

  // Get quick help from localized prompts
  getQuickHelp(topic: string): string {
    return this.prompts.quickResponses[topic] || this.getDefaultQuickHelp()
  }

  // Get fallback response from localized prompts
  getFallbackResponse(): string {
    return this.prompts.fallbackResponse
  }
  
  // Abstract method - provide default quick help message
  abstract getDefaultQuickHelp(): string
}