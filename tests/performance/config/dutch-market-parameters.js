/**
 * DUTCH MARKET PERFORMANCE PARAMETERS
 * 
 * Based on Dutch funeral industry data and growth projections
 * Netherlands Statistics: ~150,000 deaths/year, 2,400+ funeral directors
 * Market growth: 3-5% annually due to aging population
 */

export const DUTCH_MARKET_CONFIG = {
  // Current market size (2024)
  CURRENT_STATS: {
    annual_deaths: 150000,
    funeral_directors: 2400,
    venues: 800,
    families_per_year: 150000,
    average_bookings_per_family: 3.2,
    peak_season_multiplier: 1.4, // Winter months
  },

  // Growth projections (2024-2029)
  GROWTH_PROJECTIONS: {
    annual_growth_rate: 0.045, // 4.5%
    digital_adoption_rate: 0.12, // 12% yearly increase
    platform_penetration_target: 0.25, // 25% market share goal
  },

  // User behavior patterns
  USER_PATTERNS: {
    peak_hours: ['09:00-11:00', '14:00-17:00'],
    peak_days: ['tuesday', 'wednesday', 'thursday'],
    seasonal_peaks: ['november', 'december', 'january', 'february'],
    average_session_duration: 18, // minutes
    concurrent_users_ratio: 0.08, // 8% of daily users concurrent
  },

  // Performance targets for 2025
  LOAD_TARGETS: {
    // Normal load (typical day)
    normal: {
      concurrent_users: 200,
      requests_per_second: 50,
      families_active: 120,
      directors_active: 45,
      venues_active: 25,
      admin_users: 3,
    },
    
    // Peak load (busy periods)
    peak: {
      concurrent_users: 600,
      requests_per_second: 150,
      families_active: 360,
      directors_active: 135,
      venues_active: 75,
      admin_users: 8,
    },
    
    // Crisis load (pandemic-like scenarios)
    crisis: {
      concurrent_users: 1200,
      requests_per_second: 300,
      families_active: 720,
      directors_active: 270,
      venues_active: 150,
      admin_users: 15,
    },
  },

  // Performance thresholds
  SLA_TARGETS: {
    response_time_p95: 800, // ms
    response_time_p99: 1500, // ms
    availability: 99.9, // %
    error_rate_max: 0.1, // %
    websocket_latency_max: 200, // ms
    file_upload_timeout: 30, // seconds
  },

  // Database performance expectations
  DATABASE_TARGETS: {
    query_time_p95: 100, // ms
    connection_pool_utilization: 80, // %
    index_hit_ratio: 99, // %
    cache_hit_ratio: 95, // %
    max_connections: 100,
  },

  // Regional specifics
  DUTCH_SPECIFICS: {
    languages: ['nl', 'en'],
    timezone: 'Europe/Amsterdam',
    business_hours: '08:00-18:00',
    weekend_activity_factor: 0.3, // 30% of weekday activity
    mobile_usage_percentage: 65,
    preferred_browsers: ['chrome', 'safari', 'firefox', 'edge'],
  },

  // Infrastructure scaling
  SCALING_PARAMETERS: {
    auto_scale_threshold: 70, // % CPU usage
    scale_up_users_per_instance: 300,
    max_instances: 10,
    min_instances: 2,
    scale_down_delay: 600, // seconds
    health_check_interval: 30, // seconds
  },

  // Test data volumes
  TEST_DATA_VOLUMES: {
    families: 10000,
    directors: 500,
    venues: 200,
    bookings_per_month: 25000,
    documents_per_family: 12,
    messages_per_conversation: 45,
    notifications_per_user_daily: 8,
  },
};

// Calculate dynamic values based on current date
export function calculateCurrentLoadExpectations() {
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  let multiplier = 1.0;
  
  // Seasonal adjustment
  if ([10, 11, 0, 1].includes(month)) { // Nov, Dec, Jan, Feb
    multiplier *= DUTCH_MARKET_CONFIG.CURRENT_STATS.peak_season_multiplier;
  }
  
  // Time of day adjustment
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 17)) {
    multiplier *= 1.3;
  } else if (hour < 8 || hour > 20) {
    multiplier *= 0.2;
  }
  
  // Day of week adjustment
  if ([2, 3, 4].includes(dayOfWeek)) { // Tue, Wed, Thu
    multiplier *= 1.2;
  } else if ([0, 6].includes(dayOfWeek)) { // Weekend
    multiplier *= DUTCH_MARKET_CONFIG.DUTCH_SPECIFICS.weekend_activity_factor;
  }
  
  return {
    concurrent_users: Math.round(DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.concurrent_users * multiplier),
    requests_per_second: Math.round(DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.requests_per_second * multiplier),
    expected_load_factor: multiplier,
  };
}

// Generate test user distribution
export function generateUserDistribution(totalUsers) {
  const distribution = {
    families: Math.round(totalUsers * 0.60), // 60%
    directors: Math.round(totalUsers * 0.23), // 23%
    venues: Math.round(totalUsers * 0.15), // 15%
    admins: Math.round(totalUsers * 0.02), // 2%
  };
  
  // Ensure total matches
  const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (sum !== totalUsers) {
    distribution.families += (totalUsers - sum);
  }
  
  return distribution;
}

export default DUTCH_MARKET_CONFIG;