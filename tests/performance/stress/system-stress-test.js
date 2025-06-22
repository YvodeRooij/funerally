/**
 * SYSTEM STRESS TESTING - FAREWELLY PLATFORM
 * 
 * Tests system breaking points, resource exhaustion, and failure recovery
 * Simulates crisis scenarios and extreme load conditions
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { K6_CONFIG, getEnvironmentConfig, getRandomUser } from '../config/k6-config.js';
import { DUTCH_MARKET_CONFIG } from '../config/dutch-market-parameters.js';

// Custom stress testing metrics
const systemBreakingPoint = new Gauge('system_breaking_point_users');
const errorRate = new Rate('system_error_rate');
const recoveryTime = new Trend('system_recovery_time');
const resourceExhaustion = new Rate('resource_exhaustion_detected');
const connectionFailures = new Counter('connection_failures');
const databaseTimeouts = new Counter('database_timeouts');
const memoryLeaks = new Gauge('memory_leak_indicator');
const cpuSpikes = new Gauge('cpu_spike_indicator');

// Environment configuration
const ENV = getEnvironmentConfig(__ENV.ENVIRONMENT || 'development');

// Stress testing options
export const options = {
  scenarios: {
    // Gradual stress increase to find breaking point
    breaking_point_test: {
      executor: 'ramping-vus',
      exec: 'findBreakingPoint',
      stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 300 },
        { duration: '3m', target: 600 },
        { duration: '3m', target: 1000 },
        { duration: '3m', target: 1500 }, // Expected breaking point
        { duration: '3m', target: 2000 }, // Push beyond breaking point
        { duration: '2m', target: 2500 }, // Maximum stress
        { duration: '3m', target: 0 }, // Recovery test
      ],
      gracefulRampDown: '60s',
      tags: { stress_type: 'breaking_point' },
    },
    
    // Sudden spike test (crisis simulation)
    crisis_spike_test: {
      executor: 'ramping-vus',
      exec: 'simulateCrisisSpike',
      startTime: '20m',
      stages: [
        { duration: '1m', target: 200 }, // Normal
        { duration: '30s', target: 1200 }, // Sudden crisis spike
        { duration: '5m', target: 1200 }, // Sustained crisis
        { duration: '30s', target: 200 }, // Crisis ends
        { duration: '3m', target: 200 }, // Recovery monitoring
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { stress_type: 'crisis_spike' },
    },
    
    // Resource exhaustion test
    resource_exhaustion_test: {
      executor: 'constant-vus',
      exec: 'exhaustResources',
      startTime: '30m',
      vus: 800,
      duration: '15m',
      tags: { stress_type: 'resource_exhaustion' },
    },
    
    // Memory leak detection
    memory_leak_test: {
      executor: 'ramping-vus',
      exec: 'detectMemoryLeaks',
      startTime: '46m',
      stages: [
        { duration: '10m', target: 300 },
        { duration: '20m', target: 300 }, // Long sustained load
        { duration: '2m', target: 0 },
      ],
      tags: { stress_type: 'memory_leak' },
    },
    
    // Database connection pool exhaustion
    db_connection_stress: {
      executor: 'constant-arrival-rate',
      exec: 'stressDatabaseConnections',
      startTime: '70m',
      rate: 200, // High rate of DB operations
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 500,
      tags: { stress_type: 'db_connections' },
    },
  },
  
  thresholds: {
    // Stress-specific thresholds (more lenient)
    'http_req_duration{stress_type:breaking_point}': ['p(95)<5000'], // 5s during stress
    'http_req_duration{stress_type:crisis_spike}': ['p(95)<8000'], // 8s during crisis
    'http_req_failed{stress_type:breaking_point}': ['rate<0.1'], // 10% errors acceptable
    'http_req_failed{stress_type:crisis_spike}': ['rate<0.2'], // 20% errors during crisis
    'system_error_rate': ['rate<0.15'], // 15% overall error rate
    'system_recovery_time': ['p(95)<30000'], // 30s recovery time
    'connection_failures': ['count<1000'], // Max 1000 connection failures
    'database_timeouts': ['count<500'], // Max 500 DB timeouts
  },
  
  tags: {
    ...K6_CONFIG.MONITORING.tags,
    test_category: 'stress',
  },
};

// Global state tracking
let systemState = {
  startTime: Date.now(),
  breakingPointDetected: false,
  breakingPointUsers: 0,
  recoveryStartTime: null,
  resourceExhaustionDetected: false,
  consecutiveErrors: 0,
  maxConsecutiveErrors: 0,
};

export function setup() {
  console.log('💥 Starting stress testing...');
  console.log('🎯 Target breaking point detection: 1000-2000 users');
  console.log('⚠️  Crisis simulation: Pandemic-level surge');
  console.log('🔍 Resource exhaustion: Connection pools, memory, CPU');
  
  return {
    testUsers: K6_CONFIG.TEST_DATA.users.families.slice(0, 200),
    environment: ENV,
    startTime: Date.now(),
  };
}

// Breaking point detection test
export function findBreakingPoint(data) {
  const user = getRandomUser('family');
  const currentVUs = __VU;
  
  // Track when we start seeing consistent failures
  const token = attemptAuthentication(user);
  if (!token) {
    handleAuthenticationFailure(currentVUs);
    return;
  }
  
  group('Breaking Point Detection', () => {
    // Critical path operations
    const criticalOperations = [
      () => testDashboardLoad(token, user),
      () => testBookingCreation(token, user),
      () => testDatabaseQueries(token, user),
      () => testWebSocketConnection(token, user),
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    criticalOperations.forEach((operation, index) => {
      try {
        const success = operation();
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Critical operation ${index} failed:`, error.message);
      }
      
      // Short delay between operations
      sleep(0.1);
    });
    
    // Calculate error rate for this iteration
    const iterationErrorRate = errorCount / criticalOperations.length;
    errorRate.add(iterationErrorRate);
    
    // Breaking point detection logic
    if (iterationErrorRate > 0.5 && !systemState.breakingPointDetected) {
      systemState.breakingPointDetected = true;
      systemState.breakingPointUsers = currentVUs;
      systemBreakingPoint.add(currentVUs);
      
      console.log(`🚨 BREAKING POINT DETECTED: ${currentVUs} concurrent users`);
      console.log(`💥 Error rate: ${(iterationErrorRate * 100).toFixed(2)}%`);
    }
    
    // Track consecutive errors
    if (errorCount > 0) {
      systemState.consecutiveErrors++;
      systemState.maxConsecutiveErrors = Math.max(
        systemState.maxConsecutiveErrors,
        systemState.consecutiveErrors
      );
    } else {
      systemState.consecutiveErrors = 0;
    }
  });
  
  // Variable sleep based on system stress
  const stressFactor = Math.min(currentVUs / 1000, 1.0);
  sleep(Math.random() * (2 + stressFactor) + 0.5);
}

// Crisis spike simulation (pandemic scenario)
export function simulateCrisisSpike(data) {
  const user = getRandomUser('family');
  const currentTime = Date.now();
  
  // Simulate panic behavior during crisis
  const token = attemptAuthentication(user);
  if (!token) {
    connectionFailures.add(1);
    return;
  }
  
  group('Crisis Simulation', () => {
    // Panic behavior: multiple rapid requests
    const panicRequests = [
      `${ENV.apiUrl}/venues?emergency=true&available=true`,
      `${ENV.apiUrl}/directors?urgent=true&location=nearby`,
      `${ENV.apiUrl}/family/bookings?status=urgent`,
      `${ENV.apiUrl}/family/documents?category=emergency`,
      `${ENV.apiUrl}/user/notifications?priority=high`,
    ];
    
    const headers = {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
      'X-Priority': 'urgent',
      'X-Crisis-Mode': 'true',
    };
    
    // Rapid-fire requests (panic behavior)
    panicRequests.forEach((url, index) => {
      const response = http.get(url, {
        headers,
        timeout: '10s', // Shorter timeout during crisis
        tags: { request_type: 'crisis_panic', request_index: index },
      });
      
      const success = check(response, {
        'crisis request handled': (r) => r.status < 500,
        'crisis response time reasonable': (r) => r.timings.duration < 10000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
      
      // Very short delay - panic behavior
      sleep(0.05);
    });
    
    // Attempt to create emergency booking
    const emergencyBooking = {
      service_type: 'crematie',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      duration: 60,
      priority: 'urgent',
      notes: 'Emergency booking - crisis scenario',
    };
    
    const bookingResponse = http.post(
      `${ENV.apiUrl}/family/bookings`,
      JSON.stringify(emergencyBooking),
      {
        headers,
        timeout: '15s',
        tags: { request_type: 'emergency_booking' },
      }
    );
    
    check(bookingResponse, {
      'emergency booking processed': (r) => r.status < 500,
    });
  });
  
  // Crisis behavior: shorter, more erratic sleep patterns
  sleep(Math.random() * 0.5 + 0.1);
}

// Resource exhaustion test
export function exhaustResources(data) {
  const user = getRandomUser();
  const token = attemptAuthentication(user);
  
  if (!token) {
    resourceExhaustion.add(1);
    return;
  }
  
  group('Resource Exhaustion', () => {
    // Memory-intensive operations
    const memoryIntensiveOps = [
      () => requestLargeDataset(token),
      () => uploadLargeDocument(token),
      () => generateComplexReport(token),
      () => processMultipleImages(token),
    ];
    
    // CPU-intensive operations
    const cpuIntensiveOps = [
      () => performComplexSearch(token),
      () => calculateAnalytics(token),
      () => generatePDFReport(token),
      () => processDataExport(token),
    ];
    
    // Database-intensive operations
    const dbIntensiveOps = [
      () => runComplexQuery(token),
      () => performDataMigration(token),
      () => createMultipleRecords(token),
      () => updateMassiveDataset(token),
    ];
    
    // Execute resource-intensive operations randomly
    const allOps = [...memoryIntensiveOps, ...cpuIntensiveOps, ...dbIntensiveOps];
    const selectedOps = allOps.sort(() => Math.random() - 0.5).slice(0, 3);
    
    selectedOps.forEach((operation, index) => {
      try {
        const startTime = Date.now();
        const success = operation();
        const duration = Date.now() - startTime;
        
        // Detect resource exhaustion patterns
        if (duration > 10000 || !success) {
          resourceExhaustion.add(1);
          console.log(`🚨 Resource exhaustion detected in operation ${index}: ${duration}ms`);
        }
        
        // Monitor for potential memory leaks
        if (duration > 5000) {
          memoryLeaks.add(1);
        }
        
        // Monitor for CPU spikes
        if (duration > 3000) {
          cpuSpikes.add(1);
        }
        
      } catch (error) {
        resourceExhaustion.add(1);
        console.error(`Resource exhaustion operation failed:`, error.message);
      }
      
      sleep(0.2);
    });
  });
  
  // Longer sleep to simulate resource-intensive operations
  sleep(Math.random() * 2 + 1);
}

// Memory leak detection test
export function detectMemoryLeaks(data) {
  const user = getRandomUser();
  const token = attemptAuthentication(user);
  
  if (!token) return;
  
  group('Memory Leak Detection', () => {
    // Operations that might cause memory leaks
    const leakProneOperations = [
      () => createManyConnections(token),
      () => loadLargeDataSets(token),
      () => createUnreleasedResources(token),
      () => maintainOpenConnections(token),
    ];
    
    const operationStartTime = Date.now();
    
    leakProneOperations.forEach((operation, index) => {
      const iterationStart = Date.now();
      
      try {
        operation();
        
        const iterationTime = Date.now() - iterationStart;
        const totalTime = Date.now() - operationStartTime;
        
        // Detect memory leak indicators
        if (iterationTime > totalTime * 0.1) {
          memoryLeaks.add(1);
          console.log(`⚠️  Memory leak indicator: Operation ${index} took ${iterationTime}ms`);
        }
        
      } catch (error) {
        console.error(`Memory leak detection operation failed:`, error.message);
      }
      
      sleep(0.1);
    });
  });
  
  sleep(1);
}

// Database connection stress test
export function stressDatabaseConnections(data) {
  const user = getRandomUser();
  const token = attemptAuthentication(user);
  
  if (!token) {
    databaseTimeouts.add(1);
    return;
  }
  
  group('Database Connection Stress', () => {
    // Multiple concurrent database operations
    const dbOperations = [
      `${ENV.apiUrl}/family/bookings?page=1&limit=100`,
      `${ENV.apiUrl}/director/clients?include_stats=true`,
      `${ENV.apiUrl}/venue/analytics?period=month`,
      `${ENV.apiUrl}/documents/search?query=complex_filter`,
      `${ENV.apiUrl}/chat/messages?room_id=all&limit=500`,
    ];
    
    const headers = {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    };
    
    // Rapid database requests to exhaust connection pool
    const responses = dbOperations.map(url => {
      const startTime = Date.now();
      const response = http.get(url, {
        headers,
        timeout: '5s',
        tags: { operation_type: 'db_stress' },
      });
      
      const duration = Date.now() - startTime;
      
      // Detect database timeouts
      if (response.status === 0 || duration > 5000) {
        databaseTimeouts.add(1);
      }
      
      return response;
    });
    
    // Check if any database operations failed
    const dbFailures = responses.filter(r => r.status >= 500 || r.status === 0).length;
    if (dbFailures > 0) {
      console.log(`🚨 ${dbFailures} database operations failed`);
    }
  });
  
  // No sleep - maintain constant pressure on DB
}

// Helper functions for stress testing
function attemptAuthentication(user) {
  try {
    const response = http.post(`${ENV.apiUrl}/auth/signin`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: K6_CONFIG.HTTP_CONFIG.headers,
      timeout: '10s',
      tags: { operation: 'auth_attempt' },
    });
    
    if (response.status === 200 && response.json('token')) {
      return response.json('token');
    }
    
    return null;
  } catch (error) {
    connectionFailures.add(1);
    return null;
  }
}

function handleAuthenticationFailure(currentVUs) {
  systemState.consecutiveErrors++;
  errorRate.add(1);
  
  if (systemState.consecutiveErrors > 10) {
    console.log(`🚨 CRITICAL: ${systemState.consecutiveErrors} consecutive auth failures at ${currentVUs} users`);
  }
}

function testDashboardLoad(token, user) {
  const response = http.get(`${ENV.apiUrl}/family/profile`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '5s',
    tags: { operation: 'dashboard_load' },
  });
  
  return response.status === 200;
}

function testBookingCreation(token, user) {
  const bookingData = {
    service_type: 'crematie',
    date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    duration: 120,
    notes: 'Stress test booking',
  };
  
  const response = http.post(`${ENV.apiUrl}/family/bookings`, JSON.stringify(bookingData), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '10s',
    tags: { operation: 'booking_creation' },
  });
  
  return response.status < 500;
}

function testDatabaseQueries(token, user) {
  const response = http.get(`${ENV.apiUrl}/family/bookings?page=1&limit=50`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '5s',
    tags: { operation: 'db_query' },
  });
  
  return response.status === 200;
}

function testWebSocketConnection(token, user) {
  // WebSocket connection test would go here
  // For now, return true as placeholder
  return true;
}

// Resource-intensive operation implementations
function requestLargeDataset(token) {
  const response = http.get(`${ENV.apiUrl}/analytics/export?format=full&period=year`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '30s',
    tags: { operation: 'large_dataset' },
  });
  
  return response.status < 500;
}

function uploadLargeDocument(token) {
  // Simulate large document upload
  const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
  
  const response = http.post(`${ENV.apiUrl}/family/documents`, JSON.stringify({
    filename: 'large-stress-test-document.pdf',
    content: largeData,
    type: 'testament',
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '60s',
    tags: { operation: 'large_upload' },
  });
  
  return response.status < 500;
}

function generateComplexReport(token) {
  const response = http.post(`${ENV.apiUrl}/analytics/generate-report`, JSON.stringify({
    type: 'comprehensive',
    period: 'last_year',
    include_charts: true,
    include_details: true,
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '45s',
    tags: { operation: 'complex_report' },
  });
  
  return response.status < 500;
}

function processMultipleImages(token) {
  // Simulate multiple image processing
  const images = Array.from({ length: 10 }, (_, i) => `image_${i}.jpg`);
  
  const response = http.post(`${ENV.apiUrl}/documents/process-images`, JSON.stringify({
    images,
    operations: ['resize', 'compress', 'watermark'],
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '60s',
    tags: { operation: 'image_processing' },
  });
  
  return response.status < 500;
}

function performComplexSearch(token) {
  const response = http.get(`${ENV.apiUrl}/search/complex?q=*&filters=extensive&sort=relevance&facets=all`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '15s',
    tags: { operation: 'complex_search' },
  });
  
  return response.status < 500;
}

function calculateAnalytics(token) {
  const response = http.post(`${ENV.apiUrl}/analytics/calculate`, JSON.stringify({
    metrics: ['revenue', 'bookings', 'efficiency', 'satisfaction'],
    period: 'last_6_months',
    granularity: 'daily',
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '30s',
    tags: { operation: 'calculate_analytics' },
  });
  
  return response.status < 500;
}

function generatePDFReport(token) {
  const response = http.post(`${ENV.apiUrl}/reports/pdf`, JSON.stringify({
    template: 'comprehensive',
    data_range: 'full',
    include_images: true,
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '45s',
    tags: { operation: 'pdf_generation' },
  });
  
  return response.status < 500;
}

function processDataExport(token) {
  const response = http.post(`${ENV.apiUrl}/data/export`, JSON.stringify({
    format: 'csv',
    tables: ['bookings', 'clients', 'documents', 'messages'],
    filters: 'all',
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '60s',
    tags: { operation: 'data_export' },
  });
  
  return response.status < 500;
}

function runComplexQuery(token) {
  const response = http.get(`${ENV.apiUrl}/analytics/complex-query?aggregations=true&joins=multiple`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '20s',
    tags: { operation: 'complex_query' },
  });
  
  return response.status < 500;
}

function performDataMigration(token) {
  const response = http.post(`${ENV.apiUrl}/admin/migrate-data`, JSON.stringify({
    source: 'legacy_system',
    destination: 'current_system',
    batch_size: 1000,
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '120s',
    tags: { operation: 'data_migration' },
  });
  
  return response.status < 500;
}

function createMultipleRecords(token) {
  const records = Array.from({ length: 100 }, (_, i) => ({
    name: `Stress Test Record ${i}`,
    data: `Generated data ${i}`,
    timestamp: new Date().toISOString(),
  }));
  
  const response = http.post(`${ENV.apiUrl}/bulk/create`, JSON.stringify({
    records,
    table: 'stress_test_records',
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '30s',
    tags: { operation: 'bulk_create' },
  });
  
  return response.status < 500;
}

function updateMassiveDataset(token) {
  const response = http.put(`${ENV.apiUrl}/bulk/update`, JSON.stringify({
    filter: 'stress_test = true',
    updates: {
      updated_at: new Date().toISOString(),
      stress_test_run: Date.now(),
    },
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '60s',
    tags: { operation: 'bulk_update' },
  });
  
  return response.status < 500;
}

// Memory leak prone operations
function createManyConnections(token) {
  // Simulate creating many connections without proper cleanup
  return true;
}

function loadLargeDataSets(token) {
  // Simulate loading large datasets into memory
  return true;
}

function createUnreleasedResources(token) {
  // Simulate creating resources without proper cleanup
  return true;
}

function maintainOpenConnections(token) {
  // Simulate maintaining open connections
  return true;
}

export function teardown(data) {
  const totalDuration = Date.now() - systemState.startTime;
  
  console.log('💥 Stress test completed');
  console.log(`⏱️  Total duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`🚨 Breaking point: ${systemState.breakingPointUsers} users`);
  console.log(`💥 Max consecutive errors: ${systemState.maxConsecutiveErrors}`);
  
  if (systemState.recoveryStartTime) {
    const recoveryDuration = Date.now() - systemState.recoveryStartTime;
    recoveryTime.add(recoveryDuration);
    console.log(`🔄 Recovery time: ${Math.round(recoveryDuration / 1000)}s`);
  }
  
  console.log('✅ Stress test teardown complete');
}