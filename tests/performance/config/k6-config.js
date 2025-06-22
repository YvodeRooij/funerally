/**
 * K6 PERFORMANCE TESTING CONFIGURATION
 * 
 * Centralized configuration for all k6 performance tests
 * Supports multiple environments and test scenarios
 */

import { DUTCH_MARKET_CONFIG } from './dutch-market-parameters.js';

export const K6_CONFIG = {
  // Base URLs for different environments
  ENVIRONMENTS: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3000/api',
      wsUrl: 'ws://localhost:3000',
      database: 'postgresql://localhost:5432/farewelly_dev',
    },
    staging: {
      baseUrl: 'https://staging.farewelly.nl',
      apiUrl: 'https://staging.farewelly.nl/api',
      wsUrl: 'wss://staging.farewelly.nl',
      database: 'postgresql://staging-db.farewelly.nl:5432/farewelly',
    },
    production: {
      baseUrl: 'https://farewelly.nl',
      apiUrl: 'https://farewelly.nl/api',
      wsUrl: 'wss://farewelly.nl',
      database: 'postgresql://prod-db.farewelly.nl:5432/farewelly',
    },
  },

  // Test scenarios configuration
  SCENARIOS: {
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at normal load
        { duration: '2m', target: 200 }, // Ramp to peak
        { duration: '5m', target: 200 }, // Stay at peak
        { duration: '2m', target: 0 }, // Ramp down
      ],
      gracefulRampDown: '30s',
    },
    
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 600 },
        { duration: '3m', target: 600 },
        { duration: '2m', target: 1000 }, // Stress point
        { duration: '3m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 100 },
        { duration: '30s', target: 1000 }, // Sudden spike
        { duration: '2m', target: 1000 },
        { duration: '30s', target: 100 }, // Drop back
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
    
    soak_test: {
      executor: 'constant-vus',
      vus: 200,
      duration: '30m',
    },
    
    api_performance: {
      executor: 'constant-arrival-rate',
      rate: 100, // requests per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },

    websocket_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '5m', target: 500 },
        { duration: '1m', target: 0 },
      ],
    },
  },

  // Performance thresholds
  THRESHOLDS: {
    // HTTP request metrics
    http_req_duration: [
      { threshold: 'p(95)<800', abortOnFail: false },
      { threshold: 'p(99)<1500', abortOnFail: false },
      { threshold: 'avg<400', abortOnFail: false },
    ],
    http_req_failed: [
      { threshold: 'rate<0.001', abortOnFail: true }, // <0.1% errors
    ],
    http_reqs: [
      { threshold: 'rate>50', abortOnFail: false }, // Min 50 req/s
    ],
    
    // WebSocket metrics
    ws_session_duration: [
      { threshold: 'avg>10000', abortOnFail: false }, // Min 10s sessions
    ],
    ws_msgs_received: [
      { threshold: 'count>0', abortOnFail: false },
    ],
    
    // Database metrics (custom)
    db_query_duration: [
      { threshold: 'p(95)<100', abortOnFail: false },
    ],
    db_connection_pool: [
      { threshold: 'avg<80', abortOnFail: false }, // <80% utilization
    ],
    
    // Business logic metrics
    booking_creation_duration: [
      { threshold: 'p(95)<1000', abortOnFail: false },
    ],
    document_upload_duration: [
      { threshold: 'p(95)<5000', abortOnFail: false },
    ],
    chat_message_latency: [
      { threshold: 'p(95)<200', abortOnFail: false },
    ],
  },

  // Test data configuration
  TEST_DATA: {
    users: {
      families: Array.from({ length: 1000 }, (_, i) => ({
        id: `family_${i + 1}`,
        email: `family${i + 1}@test.farewelly.nl`,
        password: 'TestPassword123!',
        name: `Test Familie ${i + 1}`,
        phone: `+31612345${String(i).padStart(3, '0')}`,
        address: `Teststraat ${i + 1}, Amsterdam`,
        type: 'family'
      })),
      
      directors: Array.from({ length: 100 }, (_, i) => ({
        id: `director_${i + 1}`,
        email: `director${i + 1}@test.farewelly.nl`,
        password: 'TestPassword123!',
        name: `Uitvaartondernemer ${i + 1}`,
        company: `Uitvaartcentrum Test ${i + 1}`,
        phone: `+31612346${String(i).padStart(3, '0')}`,
        type: 'director'
      })),
      
      venues: Array.from({ length: 50 }, (_, i) => ({
        id: `venue_${i + 1}`,
        email: `venue${i + 1}@test.farewelly.nl`,
        password: 'TestPassword123!',
        name: `Test Locatie ${i + 1}`,
        venue_name: `Aula ${i + 1}`,
        address: `Locatiestraat ${i + 1}, Utrecht`,
        capacity: 50 + (i * 5),
        type: 'venue'
      })),
    },
    
    // Sample booking data
    serviceTypes: [
      'begrafenis',
      'crematie',
      'uitvaartdienst',
      'condoleance',
      'afscheidsdienst'
    ],
    
    // Sample document types
    documentTypes: [
      'overlijdensakte',
      'uittreksel_gba',
      'verzekeringspapieren',
      'testament',
      'volmacht',
      'medische_verklaring'
    ],
    
    // Sample chat messages in Dutch
    chatMessages: [
      'Goedemorgen, ik heb een vraag over de planning.',
      'Kunnen we de tijd van de dienst aanpassen?',
      'De documenten zijn nu compleet.',
      'Hartelijk dank voor uw hulp.',
      'Is er nog meer informatie nodig?',
      'De familie is akkoord met de planning.',
      'Kunnen we dit telefonisch bespreken?',
      'De locatie is gereserveerd voor aanstaande dinsdag.',
      'Er zijn nog enkele vragen van de familie.',
      'Alle formaliteiten zijn in orde.',
    ],
  },

  // Request configuration
  HTTP_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'k6-performance-test/1.0',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
    },
    timeout: 30, // seconds
    retries: 3,
    batchSize: 10,
  },

  // WebSocket configuration
  WS_CONFIG: {
    timeout: 30000, // ms
    headers: {
      'User-Agent': 'k6-websocket-test/1.0',
    },
    tags: {
      test_type: 'websocket',
    },
  },

  // Database testing configuration
  DB_CONFIG: {
    queries: {
      // Most common queries to test
      bookings_by_family: 'SELECT * FROM bookings WHERE family_id = $1 ORDER BY created_at DESC LIMIT 20',
      directors_clients: 'SELECT * FROM director_clients dc JOIN user_profiles up ON dc.family_id = up.id WHERE dc.director_id = $1',
      venue_availability: 'SELECT * FROM venue_availability WHERE venue_id = $1 AND date >= $2 AND date <= $3',
      chat_messages: 'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT 50',
      documents_by_family: 'SELECT * FROM documents WHERE family_id = $1 AND deleted_at IS NULL',
      user_notifications: 'SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY created_at DESC',
      booking_analytics: `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as total_bookings,
          AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completion_rate
        FROM bookings 
        WHERE created_at >= $1 AND created_at <= $2 
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `,
    },
    
    // Connection pool settings for testing
    poolConfig: {
      min: 5,
      max: 100,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
  },

  // Monitoring and reporting
  MONITORING: {
    tags: {
      environment: __ENV.ENVIRONMENT || 'development',
      test_type: 'performance',
      market: 'dutch',
      version: '1.0.0',
    },
    
    // InfluxDB configuration (if using)
    influxdb: {
      url: __ENV.INFLUXDB_URL || 'http://localhost:8086',
      database: 'k6_performance',
      username: __ENV.INFLUXDB_USER || 'k6',
      password: __ENV.INFLUXDB_PASSWORD || 'k6',
    },
    
    // Grafana dashboard URLs
    dashboards: {
      main: 'http://localhost:3000/d/k6-performance/k6-performance-testing',
      websockets: 'http://localhost:3000/d/k6-websockets/k6-websocket-performance',
      database: 'http://localhost:3000/d/k6-database/k6-database-performance',
    },
  },
};

// Helper function to get environment config
export function getEnvironmentConfig(env = 'development') {
  return K6_CONFIG.ENVIRONMENTS[env] || K6_CONFIG.ENVIRONMENTS.development;
}

// Helper function to get random test user
export function getRandomUser(type = 'family') {
  const users = K6_CONFIG.TEST_DATA.users[type + 's'] || K6_CONFIG.TEST_DATA.users.families;
  return users[Math.floor(Math.random() * users.length)];
}

// Helper function to get random test data
export function getRandomTestData(type) {
  const data = K6_CONFIG.TEST_DATA[type];
  if (Array.isArray(data)) {
    return data[Math.floor(Math.random() * data.length)];
  }
  return data;
}

export default K6_CONFIG;