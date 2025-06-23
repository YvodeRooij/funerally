import { BaseDashboardHelper, HelperAgentConfig } from './base-helper-agent'

export class DirectorDashboardHelper extends BaseDashboardHelper {
  constructor(locale: string = 'nl') {
    const config: HelperAgentConfig = {
      userType: 'director',
      locale: locale,
      temperature: 0.2 // Lower temperature for more consistent professional responses
    }
    super(config)
  }

  getDefaultQuickHelp(): string {
    const defaults: Record<string, string> = {
      nl: "Specificeer je vraag voor gerichte hulp.",
      en: "Please specify your question for targeted assistance.",
    }
    return defaults[this.locale] || defaults['nl']
  }
}