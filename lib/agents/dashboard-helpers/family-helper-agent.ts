import { BaseDashboardHelper, HelperAgentConfig } from './base-helper-agent'

export class FamilyDashboardHelper extends BaseDashboardHelper {
  constructor(locale: string = 'nl') {
    const config: HelperAgentConfig = {
      userType: 'family',
      locale: locale,
      temperature: 0.3
    }
    super(config)
  }

  getDefaultQuickHelp(): string {
    // Language-aware default response
    const defaults: Record<string, string> = {
      nl: "Ik help je graag. Kun je je vraag iets specifieker maken?",
      en: "I'm happy to help. Could you be more specific about your question?",
      ar: "يسعدني مساعدتك. هل يمكنك توضيح سؤالك أكثر؟",
      tr: "Size yardımcı olmaktan mutluluk duyarım. Sorunuzu biraz daha açabilir misiniz?"
    }
    return defaults[this.locale] || defaults['nl']
  }
}