/**
 * API LOAD TESTING - FAREWELLY PLATFORM
 * 
 * Comprehensive load testing for all major API endpoints
 * Tests normal and peak loads based on Dutch market parameters
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { K6_CONFIG, getEnvironmentConfig, getRandomUser, getRandomTestData } from '../config/k6-config.js';
import { DUTCH_MARKET_CONFIG, calculateCurrentLoadExpectations } from '../config/dutch-market-parameters.js';

// Custom metrics
const bookingCreationRate = new Rate('booking_creation_success');
const bookingCreationTime = new Trend('booking_creation_duration');
const documentUploadRate = new Rate('document_upload_success');
const documentUploadTime = new Trend('document_upload_duration');
const apiResponseTime = new Trend('api_response_time');
const authenticationTime = new Trend('authentication_duration');
const errorCounter = new Counter('api_errors');

// Environment configuration
const ENV = getEnvironmentConfig(__ENV.ENVIRONMENT || 'development');

// Load testing options
export const options = {
  scenarios: {
    // Normal business hours load
    normal_load: {
      executor: 'ramping-vus',
      exec: 'normalLoadTest',
      stages: [
        { duration: '3m', target: DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.concurrent_users },
        { duration: '10m', target: DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.concurrent_users },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { load_type: 'normal' },
    },
    
    // Peak hours load (busy periods)
    peak_load: {
      executor: 'ramping-vus',
      exec: 'peakLoadTest',
      startTime: '16m',
      stages: [
        { duration: '2m', target: DUTCH_MARKET_CONFIG.LOAD_TARGETS.peak.concurrent_users },
        { duration: '8m', target: DUTCH_MARKET_CONFIG.LOAD_TARGETS.peak.concurrent_users },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { load_type: 'peak' },
    },
    
    // API-focused constant rate testing
    api_constant_rate: {
      executor: 'constant-arrival-rate',
      exec: 'apiConstantRateTest',
      startTime: '28m',
      rate: DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.requests_per_second,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      tags: { load_type: 'constant_rate' },
    },
  ],
  
  thresholds: {
    ...K6_CONFIG.THRESHOLDS,
    'http_req_duration{load_type:normal}': ['p(95)<800'],
    'http_req_duration{load_type:peak}': ['p(95)<1200'],
    'http_req_failed{load_type:normal}': ['rate<0.001'],
    'http_req_failed{load_type:peak}': ['rate<0.005'],
    'booking_creation_duration': ['p(95)<1500'],
    'document_upload_duration': ['p(95)<5000'],
    'authentication_duration': ['p(95)<500'],
  },
  
  tags: K6_CONFIG.MONITORING.tags,
};

// Global variables
let authTokens = new Map();
let testUsers = [];

export function setup() {
  console.log('🔧 Setting up load test...');
  
  // Pre-authenticate test users for better performance
  const familyUsers = K6_CONFIG.TEST_DATA.users.families.slice(0, 50);
  const directorUsers = K6_CONFIG.TEST_DATA.users.directors.slice(0, 20);
  const venueUsers = K6_CONFIG.TEST_DATA.users.venues.slice(0, 10);
  
  testUsers = [...familyUsers, ...directorUsers, ...venueUsers];
  
  console.log(`📊 Test setup complete. Users: ${testUsers.length}`);
  console.log(`🎯 Normal load target: ${DUTCH_MARKET_CONFIG.LOAD_TARGETS.normal.concurrent_users} users`);
  console.log(`🚀 Peak load target: ${DUTCH_MARKET_CONFIG.LOAD_TARGETS.peak.concurrent_users} users`);
  
  return { testUsers, environment: ENV };
}

// Normal load test scenario
export function normalLoadTest(data) {
  const user = getRandomTestUser();
  const token = authenticateUser(user);
  
  if (!token) {
    errorCounter.add(1, { error_type: 'authentication' });
    return;
  }
  
  // Simulate typical user journey
  group('Normal User Journey', () => {
    // 1. Dashboard/Profile access (most common)
    group('Dashboard Access', () => {
      simulateDashboardAccess(token, user);
    });
    
    // 2. Browse/search functionality
    if (Math.random() < 0.7) { // 70% probability
      group('Browse Content', () => {
        simulateBrowsing(token, user);
      });
    }
    
    // 3. Create/manage bookings (30% of sessions)
    if (Math.random() < 0.3) {
      group('Booking Management', () => {
        simulateBookingFlow(token, user);
      });
    }
    
    // 4. Communication/messaging (25% of sessions)
    if (Math.random() < 0.25) {
      group('Communication', () => {
        simulateMessaging(token, user);
      });
    }
    
    // 5. Document management (20% of sessions)
    if (Math.random() < 0.2) {
      group('Document Management', () => {
        simulateDocumentOperations(token, user);
      });
    }
  });
  
  // Realistic user behavior - read time, think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds between actions
}

// Peak load test scenario
export function peakLoadTest(data) {
  const user = getRandomTestUser();
  const token = authenticateUser(user);
  
  if (!token) {
    errorCounter.add(1, { error_type: 'authentication' });
    return;
  }
  
  // Peak hours have more intensive usage patterns
  group('Peak Load User Journey', () => {
    // Higher probability of booking-related activities during peak hours
    if (Math.random() < 0.5) { // 50% probability
      group('Intensive Booking Flow', () => {
        simulateIntensiveBookingFlow(token, user);
      });
    }
    
    // More frequent communication during peak hours
    if (Math.random() < 0.4) { // 40% probability
      group('Active Communication', () => {
        simulateActiveCommunication(token, user);
      });
    }
    
    // Dashboard access (always)
    group('Dashboard Access', () => {
      simulateDashboardAccess(token, user);
    });
    
    // Search and filtering (higher usage)
    if (Math.random() < 0.8) { // 80% probability
      group('Advanced Search', () => {
        simulateAdvancedSearch(token, user);
      });
    }
  });
  
  // Shorter sleep during peak - users are more active
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

// Constant rate API testing
export function apiConstantRateTest(data) {
  const user = getRandomTestUser();
  const token = authenticateUser(user);
  
  if (!token) {
    errorCounter.add(1, { error_type: 'authentication' });
    return;
  }
  
  // Focus on core API endpoints with high precision timing
  const apiEndpoint = getRandomApiEndpoint(user.type);
  testApiEndpoint(token, user, apiEndpoint);
}

// Authentication helper
function authenticateUser(user) {
  const startTime = Date.now();
  
  const loginResponse = http.post(`${ENV.apiUrl}/auth/signin`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: K6_CONFIG.HTTP_CONFIG.headers,
    tags: { endpoint: 'auth/signin' },
  });
  
  const authTime = Date.now() - startTime;
  authenticationTime.add(authTime);
  
  const success = check(loginResponse, {
    'authentication successful': (r) => r.status === 200,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (success && loginResponse.json('token')) {
    const token = loginResponse.json('token');
    authTokens.set(user.id, token);
    return token;
  }
  
  return null;
}

// Dashboard access simulation
function simulateDashboardAccess(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  let dashboardUrl;
  switch (user.type) {
    case 'family':
      dashboardUrl = `${ENV.apiUrl}/family/profile`;
      break;
    case 'director':
      dashboardUrl = `${ENV.apiUrl}/director/clients`;
      break;
    case 'venue':
      dashboardUrl = `${ENV.apiUrl}/venue/bookings`;
      break;
    default:
      dashboardUrl = `${ENV.apiUrl}/user/profile`;
  }
  
  const response = http.get(dashboardUrl, { headers, tags: { endpoint: 'dashboard' } });
  
  check(response, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: 'dashboard' });
}

// Browsing simulation
function simulateBrowsing(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Browse venues (common action)
  const venuesResponse = http.get(`${ENV.apiUrl}/venues?page=1&limit=20`, { 
    headers, 
    tags: { endpoint: 'venues/browse' } 
  });
  
  check(venuesResponse, {
    'venues browsing successful': (r) => r.status === 200,
    'venues response contains data': (r) => r.json('data') && r.json('data').length > 0,
  });
  
  // If family user, might search for directors
  if (user.type === 'family') {
    const directorsResponse = http.get(`${ENV.apiUrl}/directors/search?location=amsterdam`, { 
      headers, 
      tags: { endpoint: 'directors/search' } 
    });
    
    check(directorsResponse, {
      'directors search successful': (r) => r.status === 200,
    });
  }
}

// Booking flow simulation
function simulateBookingFlow(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  const startTime = Date.now();
  
  if (user.type === 'family') {
    // Family creating a booking
    const bookingData = {
      service_type: getRandomTestData('serviceTypes'),
      date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 30 days
      time: '14:00',
      duration: 120,
      notes: 'Test booking via performance test',
    };
    
    const bookingResponse = http.post(`${ENV.apiUrl}/family/bookings`, JSON.stringify(bookingData), {
      headers,
      tags: { endpoint: 'bookings/create' },
    });
    
    const success = check(bookingResponse, {
      'booking creation successful': (r) => r.status === 200 || r.status === 201,
      'booking response has ID': (r) => r.json('data') && r.json('data').id,
    });
    
    const creationTime = Date.now() - startTime;
    bookingCreationTime.add(creationTime);
    bookingCreationRate.add(success);
    
    // Follow up with getting booking details
    if (success && bookingResponse.json('data.id')) {
      const bookingId = bookingResponse.json('data.id');
      sleep(0.5);
      
      const detailResponse = http.get(`${ENV.apiUrl}/family/bookings/${bookingId}`, {
        headers,
        tags: { endpoint: 'bookings/detail' },
      });
      
      check(detailResponse, {
        'booking detail retrieval successful': (r) => r.status === 200,
      });
    }
  } else if (user.type === 'director') {
    // Director managing bookings
    const bookingsResponse = http.get(`${ENV.apiUrl}/director/clients?page=1&limit=10`, {
      headers,
      tags: { endpoint: 'director/clients' },
    });
    
    check(bookingsResponse, {
      'director clients retrieval successful': (r) => r.status === 200,
    });
  }
}

// Intensive booking flow for peak testing
function simulateIntensiveBookingFlow(token, user) {
  simulateBookingFlow(token, user);
  
  // Additional intensive operations during peak
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Multiple rapid API calls (simulating urgent booking scenarios)
  const endpoints = [
    `${ENV.apiUrl}/venues?available=true`,
    `${ENV.apiUrl}/directors/nearby`,
    `${ENV.apiUrl}/calendar/availability`,
  ];
  
  endpoints.forEach(url => {
    const response = http.get(url, { headers, tags: { endpoint: 'intensive_search' } });
    check(response, {
      'intensive search successful': (r) => r.status === 200,
    });
    sleep(0.1); // Very short delay
  });
}

// Messaging simulation
function simulateMessaging(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Get chat rooms
  const roomsResponse = http.get(`${ENV.apiUrl}/family/chat/rooms`, {
    headers,
    tags: { endpoint: 'chat/rooms' },
  });
  
  check(roomsResponse, {
    'chat rooms retrieval successful': (r) => r.status === 200,
  });
  
  // Send a message (simulate)
  if (roomsResponse.json('data') && roomsResponse.json('data').length > 0) {
    const roomId = roomsResponse.json('data')[0].id;
    const messageData = {
      content: getRandomTestData('chatMessages'),
      type: 'text',
    };
    
    const messageResponse = http.post(`${ENV.apiUrl}/family/chat/rooms/${roomId}/messages`, 
      JSON.stringify(messageData), {
        headers,
        tags: { endpoint: 'chat/send' },
      });
    
    check(messageResponse, {
      'message sending successful': (r) => r.status === 200 || r.status === 201,
    });
  }
}

// Active communication for peak testing
function simulateActiveCommunication(token, user) {
  simulateMessaging(token, user);
  
  // Additional communication activities
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Check notifications more frequently
  const notificationsResponse = http.get(`${ENV.apiUrl}/user/notifications?unread=true`, {
    headers,
    tags: { endpoint: 'notifications/check' },
  });
  
  check(notificationsResponse, {
    'notifications check successful': (r) => r.status === 200,
  });
}

// Document operations simulation
function simulateDocumentOperations(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  if (user.type === 'family') {
    // List documents
    const documentsResponse = http.get(`${ENV.apiUrl}/family/documents`, {
      headers,
      tags: { endpoint: 'documents/list' },
    });
    
    check(documentsResponse, {
      'documents listing successful': (r) => r.status === 200,
    });
    
    // Simulate document upload (mock)
    const uploadStartTime = Date.now();
    const uploadData = {
      filename: 'test-document.pdf',
      type: getRandomTestData('documentTypes'),
      size: Math.floor(Math.random() * 1000000) + 100000, // 100KB - 1MB
    };
    
    const uploadResponse = http.post(`${ENV.apiUrl}/family/documents`, JSON.stringify(uploadData), {
      headers,
      tags: { endpoint: 'documents/upload' },
    });
    
    const uploadTime = Date.now() - uploadStartTime;
    documentUploadTime.add(uploadTime);
    
    const uploadSuccess = check(uploadResponse, {
      'document upload successful': (r) => r.status === 200 || r.status === 201,
    });
    
    documentUploadRate.add(uploadSuccess);
  }
}

// Advanced search simulation
function simulateAdvancedSearch(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  const searchQueries = [
    'venues?location=amsterdam&capacity>50',
    'directors?specialization=crematie&city=rotterdam',
    'bookings?status=pending&date_from=2024-01-01',
    'documents?type=overlijdensakte&created_after=2024-01-01',
  ];
  
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const searchResponse = http.get(`${ENV.apiUrl}/${query}`, {
    headers,
    tags: { endpoint: 'advanced_search' },
  });
  
  check(searchResponse, {
    'advanced search successful': (r) => r.status === 200,
    'search results returned': (r) => r.json('data') !== undefined,
  });
}

// API endpoint testing
function testApiEndpoint(token, user, endpoint) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  const response = http.get(`${ENV.apiUrl}${endpoint}`, {
    headers,
    tags: { endpoint: endpoint.split('/')[1] || 'api' },
  });
  
  check(response, {
    'API endpoint responsive': (r) => r.status === 200,
    'API response time acceptable': (r) => r.timings.duration < 1000,
  });
  
  apiResponseTime.add(response.timings.duration, { endpoint: endpoint.split('/')[1] });
}

// Helper functions
function getRandomTestUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomApiEndpoint(userType) {
  const endpoints = {
    family: [
      '/family/profile',
      '/family/bookings',
      '/family/documents',
      '/family/chat/rooms',
      '/venues',
    ],
    director: [
      '/director/clients',
      '/director/calendar',
      '/director/analytics',
      '/director/venues',
    ],
    venue: [
      '/venue/bookings',
      '/venue/availability',
      '/venue/analytics',
    ],
  };
  
  const userEndpoints = endpoints[userType] || endpoints.family;
  return userEndpoints[Math.floor(Math.random() * userEndpoints.length)];
}

export function teardown(data) {
  console.log('🧹 Cleaning up load test...');
  authTokens.clear();
  console.log('✅ Load test teardown complete');
}