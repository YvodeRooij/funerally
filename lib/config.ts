// Production configuration
// TODO PRODUCTION: Set these values for production deployment

export const CONFIG = {
  // Demo mode - set to false for production
  DEMO_MODE: process.env.NODE_ENV === 'development', // Change to: false
  
  // Database mode - set to 'production' for real database
  DATABASE_MODE: process.env.NODE_ENV === 'development' ? 'demo' : 'production', // Change to: 'production'
  
  // Auth mode - set to 'required' for production
  AUTH_MODE: process.env.NODE_ENV === 'development' ? 'optional' : 'required', // Change to: 'required'
  
  // API endpoints
  ENDPOINTS: {
    REPORT_GENERATION: process.env.NODE_ENV === 'development' ? '/api/demo/generate-report' : '/api/generate-intake-report',
    DIRECTOR_ACCESS: process.env.NODE_ENV === 'development' ? '/api/demo/director-access' : '/api/generate-intake-report'
  },
  
  // Demo data
  DEMO_CODES: ['DEMO-123', 'TEST-456', 'SAMPLE-789'],
  
  // Feature flags
  FEATURES: {
    SHOW_DEMO_INDICATORS: process.env.NODE_ENV === 'development', // Change to: false
    ALLOW_DEMO_DELETION: process.env.NODE_ENV === 'development', // Change to: false
    SHOW_DEBUG_INFO: process.env.NODE_ENV === 'development' // Change to: false
  }
}

// Easy production switch - change this one value to go live
export const IS_PRODUCTION = false // Change to: true

// Production override
if (IS_PRODUCTION) {
  CONFIG.DEMO_MODE = false
  CONFIG.DATABASE_MODE = 'production'
  CONFIG.AUTH_MODE = 'required'
  CONFIG.FEATURES.SHOW_DEMO_INDICATORS = false
  CONFIG.FEATURES.ALLOW_DEMO_DELETION = false
  CONFIG.FEATURES.SHOW_DEBUG_INFO = false
}

// Helper functions
export const isDemoMode = () => CONFIG.DEMO_MODE
export const isProduction = () => IS_PRODUCTION
export const requiresAuth = () => CONFIG.AUTH_MODE === 'required'
export const showDemoIndicators = () => CONFIG.FEATURES.SHOW_DEMO_INDICATORS