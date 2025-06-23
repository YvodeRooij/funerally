import { BaseDashboardHelper } from './base-helper-agent'
import { FamilyDashboardHelper } from './family-helper-agent'
import { DirectorDashboardHelper } from './director-helper-agent'
import { VenueDashboardHelper } from './venue-helper-agent'

export type AgentType = 'family' | 'director' | 'venue'

/**
 * Factory to create the appropriate dashboard helper agent
 * based on user type and locale
 */
export class DashboardHelperFactory {
  private static instances: Map<string, BaseDashboardHelper> = new Map()

  /**
   * Get or create a dashboard helper instance
   * @param agentType - The type of user (family, director, venue)
   * @param locale - The locale/language code (nl, en, ar, tr, etc.)
   * @returns The appropriate dashboard helper instance
   */
  static getHelper(agentType: AgentType, locale: string = 'nl'): BaseDashboardHelper {
    const key = `${agentType}-${locale}`
    
    // Return cached instance if exists
    if (this.instances.has(key)) {
      return this.instances.get(key)!
    }

    // Create new instance based on type
    let helper: BaseDashboardHelper

    switch (agentType) {
      case 'family':
        helper = new FamilyDashboardHelper(locale)
        break
      case 'director':
        helper = new DirectorDashboardHelper(locale)
        break
      case 'venue':
        helper = new VenueDashboardHelper(locale)
        break
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }

    // Cache the instance
    this.instances.set(key, helper)
    return helper
  }

  /**
   * Clear all cached instances (useful for testing or memory management)
   */
  static clearCache(): void {
    this.instances.clear()
  }
}

// Convenience function for direct use
export function getDashboardHelper(agentType: AgentType, locale: string = 'nl'): BaseDashboardHelper {
  return DashboardHelperFactory.getHelper(agentType, locale)
}