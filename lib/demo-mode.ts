// Demo mode configuration for testing without full auth
// TODO PRODUCTION: Set enabled: false for production
export const DEMO_MODE = {
  enabled: process.env.NODE_ENV === 'development', // Change to false for production
  
  // Demo family user
  demoFamily: {
    id: 'demo-family-123',
    email: 'demo-family@funerally.dev',
    name: 'Demo Familie',
    userType: 'family' as const,
    isDemo: true
  },
  
  // Demo director user  
  demoDirector: {
    id: 'demo-director-456',
    email: 'demo-director@funerally.dev',
    name: 'Demo Uitvaartondernemer',
    userType: 'director' as const,
    company: 'Demo Uitvaartcentrum',
    phone: '+31 20 123 4567',
    isDemo: true
  },
  
  // Demo access codes for testing
  demoCodes: {
    'DEMO-123': {
      reportId: 'demo-report-1',
      familyId: 'demo-family-123',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
}

// Mock session for demo mode
export function createDemoSession(userType: 'family' | 'director') {
  if (!DEMO_MODE.enabled) return null
  
  const user = userType === 'family' ? DEMO_MODE.demoFamily : DEMO_MODE.demoDirector
  
  return {
    user: {
      ...user,
      id: user.id,
      userId: user.id
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

// Check if we're in demo mode
export function isDemoMode(): boolean {
  return DEMO_MODE.enabled
}

// Force demo mode (for testing)
export function enableDemoMode(): void {
  // Only allow in development
  if (process.env.NODE_ENV === 'development') {
    (DEMO_MODE as any).enabled = true
  }
}

// Get demo mode status for UI
export function getDemoModeInfo() {
  return {
    enabled: DEMO_MODE.enabled,
    environment: process.env.NODE_ENV,
    message: DEMO_MODE.enabled ? 'Demo mode active - using mock data' : 'Production mode'
  }
}

// Get demo data for testing
export function getDemoReportData() {
  return {
    id: 'demo-report-1',
    report_data: {
      analysis: {
        familySituation: 'Demo familie uit Amsterdam, contactpersoon is de partner van de overledene',
        funeralPreferences: 'Voorkeur voor crematie in een rustige setting, mogelijk met kleine ceremonie',
        practicalPlanning: 'Geschat 40-50 gasten, budget rond €6.000, planning binnen 2 weken',
        communicationProfile: 'Familie geeft de voorkeur aan telefonisch contact en persoonlijke begeleiding. Hebben veel vragen gesteld over kosten en opties.',
        directorRecommendations: 'Empathische benadering gewenst. Familie heeft behoefte aan duidelijke uitleg over het crematie proces. Budget bewust maar bereid te investeren in waardig afscheid.',
        summary: 'Crematie gewenst voor demo overledene, 40-50 gasten, budget €6.000, telefonisch contact gewenst',
        urgencyLevel: 'medium' as const,
        preferredContact: 'phone' as const,
        fullReport: `# Demo Uitvaart Rapport\n\n## Familie Informatie\n**Naam:** Demo Overledene\n**Relatie:** Partner\n\n## Voorkeuren\nCrematie met kleine ceremonie, 40-50 gasten, budget €6.000\n\n---\n*Demo rapport gegenereerd voor test doeleinden*`
      },
      generated_at: new Date().toISOString(),
      version: '2.0'
    },
    created_at: new Date().toISOString()
  }
}