// Centralized prompt management for scalability and i18n support

export interface AgentPrompts {
  systemPrompt: string
  quickResponses: Record<string, string>
  fallbackResponse: string
  examples?: Record<string, { question: string; answer: string }>
}

export interface LocalizedPrompts {
  [locale: string]: AgentPrompts
}

// Type-safe prompt keys for each agent type
export type FamilyPromptKeys = 'verzenden' | 'documenten' | 'wijzigen' | 'contact' | 'status' | 'kosten'
export type DirectorPromptKeys = 'rapport' | 'venue' | 'planning' | 'klanten' | 'facturatie' | 'documenten' 
export type VenuePromptKeys = 'beschikbaarheid' | 'boekingen' | 'tarieven' | 'faciliteiten' | 'reviews' | 'statistieken'

// Import all prompts
import familyNL from './family/nl'
import familyEN from './family/en'
import directorNL from './director/nl'
import directorEN from './director/en'
import venueNL from './venue/nl'
import venueEN from './venue/en'

// Prompt registry for all agents and languages
export const AGENT_PROMPTS: {
  family: LocalizedPrompts
  director: LocalizedPrompts
  venue: LocalizedPrompts
} = {
  family: {
    nl: familyNL,
    en: familyEN,
    // Easy to add more languages:
    // ar: familyAR,
    // tr: familyTR,
  },
  director: {
    nl: directorNL,
    en: directorEN,
  },
  venue: {
    nl: venueNL,
    en: venueEN,
  }
}

// Helper to get prompts with fallback to Dutch
export function getAgentPrompts(
  agentType: 'family' | 'director' | 'venue',
  locale: string = 'nl'
): AgentPrompts {
  const prompts = AGENT_PROMPTS[agentType]
  return prompts[locale] || prompts['nl'] // Fallback to Dutch if locale not found
}

// Country-specific configurations
export interface CountryConfig {
  emergencyNumber: string
  supportEmail: string
  supportHours: string
  currency: string
  dateFormat: string
  requiredDocuments?: string[]
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  nl: {
    emergencyNumber: '0800-1234567',
    supportEmail: 'support@funerally.nl',
    supportHours: '24/7',
    currency: '€',
    dateFormat: 'DD-MM-YYYY',
    requiredDocuments: [
      'Overlijdensakte',
      'Identiteitsbewijs',
      'Verzekeringspolis',
      'Uittreksel GBA',
      'Toestemmingsverklaring'
    ]
  },
  en: {
    emergencyNumber: '0800-FUNERAL',
    supportEmail: 'support@funerally.com',
    supportHours: '24/7',
    currency: '£',
    dateFormat: 'MM/DD/YYYY',
    requiredDocuments: [
      'Death Certificate',
      'ID Document',
      'Insurance Policy',
      'Residency Extract',
      'Consent Form'
    ]
  },
  // Easy to add more countries
  tr: {
    emergencyNumber: '0800-CENAZE',
    supportEmail: 'destek@funerally.tr',
    supportHours: '24/7',
    currency: '₺',
    dateFormat: 'DD.MM.YYYY',
    requiredDocuments: [
      'Ölüm Belgesi',
      'Kimlik Belgesi',
      'Sigorta Poliçesi',
      'İkametgah Belgesi',
      'Muvafakatname'
    ]
  }
}