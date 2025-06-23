import { BaseDashboardHelper, HelperAgentConfig } from './base-helper-agent'

export class VenueDashboardHelper extends BaseDashboardHelper {
  constructor(locale: string = 'nl') {
    const config: HelperAgentConfig = {
      userType: 'venue',
      locale: locale,
      temperature: 0.2
    }
    super(config)
  }

  getDefaultQuickHelp(): string {
    const defaults: Record<string, string> = {
      nl: "Welk onderdeel van het venue beheer betreft je vraag?",
      en: "Which aspect of venue management is your question about?",
    }
    return defaults[this.locale] || defaults['nl']
  }
}