/**
 * HORIZONTAL SCALING & SCALABILITY TESTING - FAREWELLY PLATFORM
 * 
 * Tests horizontal scaling capabilities, resource utilization, and bottleneck identification
 * Simulates auto-scaling scenarios and growth patterns
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { K6_CONFIG, getEnvironmentConfig, getRandomUser } from '../config/k6-config.js';
import { DUTCH_MARKET_CONFIG, generateUserDistribution } from '../config/dutch-market-parameters.js';

// Scalability metrics
const instanceUtilization = new Gauge('instance_utilization_percentage');
const responseTimeScaling = new Trend('response_time_scaling');
const throughputScaling = new Trend('throughput_scaling');
const errorRateScaling = new Rate('error_rate_scaling');
const resourceBottlenecks = new Counter('resource_bottlenecks_detected');
const scalingEvents = new Counter('scaling_events');
const loadBalancerEfficiency = new Gauge('load_balancer_efficiency');
const databaseConnectionPoolUtilization = new Gauge('db_pool_utilization_scaling');
const memoryUsageScaling = new Gauge('memory_usage_scaling');
const cpuUsageScaling = new Gauge('cpu_usage_scaling');
const networkLatencyScaling = new Trend('network_latency_scaling');

// Environment configuration
const ENV = getEnvironmentConfig(__ENV.ENVIRONMENT || 'development');

// Scalability testing options
export const options = {
  scenarios: {
    // Gradual growth simulation (6 months growth pattern)
    gradual_growth_test: {
      executor: 'ramping-vus',
      exec: 'simulateGradualGrowth',
      stages: [
        // Month 1: Initial adoption
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        
        // Month 2-3: Steady growth
        { duration: '5m', target: 200 },
        { duration: '5m', target: 350 },
        
        // Month 4-5: Accelerated adoption
        { duration: '5m', target: 500 },
        { duration: '5m', target: 750 },
        
        // Month 6: Peak usage
        { duration: '5m', target: 1000 },
        { duration: '5m', target: 1000 },
        
        // Scale down
        { duration: '5m', target: 0 },
      ],
      gracefulRampDown: '2m',
      tags: { scaling_test: 'gradual_growth' },
    },
    
    // Sudden viral growth simulation
    viral_growth_test: {
      executor: 'ramping-vus',
      exec: 'simulateViralGrowth',
      startTime: '50m',
      stages: [
        { duration: '2m', target: 100 }, // Normal state
        { duration: '1m', target: 500 }, // Rapid uptake
        { duration: '2m', target: 1200 }, // Viral spread
        { duration: '5m', target: 1200 }, // Sustained viral load
        { duration: '3m', target: 800 }, // Stabilization
        { duration: '2m', target: 300 }, // Return to elevated normal
        { duration: '2m', target: 0 },
      ],
      tags: { scaling_test: 'viral_growth' },
    },
    
    // Peak season simulation (winter months in Netherlands)
    peak_season_test: {
      executor: 'ramping-vus',
      exec: 'simulatePeakSeason',
      startTime: '68m',
      stages: [
        { duration: '3m', target: 300 }, // Pre-season
        { duration: '2m', target: 600 }, // Season starts
        { duration: '8m', target: 900 }, // Peak season sustained
        { duration: '2m', target: 600 }, // Season ends
        { duration: '3m', target: 300 }, // Post-season
        { duration: '2m', target: 0 },
      ],
      tags: { scaling_test: 'peak_season' },
    },
    
    // Auto-scaling threshold testing
    autoscaling_threshold_test: {
      executor: 'ramping-arrival-rate',
      exec: 'testAutoScalingThresholds',
      startTime: '89m',
      stages: [
        { duration: '3m', target: 50 }, // Below threshold
        { duration: '2m', target: 150 }, // Trigger scale up
        { duration: '5m', target: 250 }, // Sustained high load
        { duration: '2m', target: 100 }, // Scale down trigger
        { duration: '3m', target: 30 }, // Below threshold
      ],
      preAllocatedVUs: 100,
      maxVUs: 500,
      tags: { scaling_test: 'autoscaling' },
    },
    
    // Resource bottleneck identification
    bottleneck_identification_test: {
      executor: 'constant-vus',
      exec: 'identifyBottlenecks',
      startTime: '105m',
      vus: 400,
      duration: '15m',
      tags: { scaling_test: 'bottlenecks' },
    },
    
    // Multi-region scaling simulation
    multiregion_scaling_test: {
      executor: 'ramping-vus',
      exec: 'simulateMultiRegionScaling',
      startTime: '121m',
      stages: [
        { duration: '3m', target: 200 }, // Primary region
        { duration: '2m', target: 400 }, // Add secondary region
        { duration: '5m', target: 600 }, // Add tertiary region
        { duration: '3m', target: 400 }, // Remove tertiary
        { duration: '2m', target: 200 }, // Remove secondary
        { duration: '3m', target: 0 }, // Scale down
      ],
      tags: { scaling_test: 'multiregion' },
    },
  },
  
  thresholds: {
    'response_time_scaling': [
      { threshold: 'p(95)<1500', abortOnFail: false }, // Allow degradation during scaling
      { threshold: 'p(99)<3000', abortOnFail: false },
    ],
    'throughput_scaling': [
      { threshold: 'rate>10', abortOnFail: false }, // Minimum throughput
    ],
    'error_rate_scaling': [
      { threshold: 'rate<0.05', abortOnFail: false }, // 5% errors during scaling
    ],
    'instance_utilization': [
      { threshold: 'value<90', abortOnFail: false }, // Max 90% utilization
    ],
    'load_balancer_efficiency': [
      { threshold: 'value>80', abortOnFail: false }, // Min 80% efficiency
    ],
    'db_pool_utilization_scaling': [
      { threshold: 'value<85', abortOnFail: false }, // Max 85% DB pool usage
    ],
  },
  
  tags: {
    ...K6_CONFIG.MONITORING.tags,
    test_category: 'scalability',
  },
};

// Global scaling state
let scalingState = {
  currentUsers: 0,
  instanceCount: 1,
  resourceMetrics: {
    cpu: 0,
    memory: 0,
    network: 0,
    database: 0,
  },
  bottlenecks: [],
  scalingEvents: [],
};

export function setup() {
  console.log('📈 Starting horizontal scaling & scalability testing...');
  console.log('🎯 Simulating growth patterns, auto-scaling, and bottleneck identification');
  console.log('🌍 Testing multi-region scaling scenarios');
  
  return {
    testUsers: [
      ...K6_CONFIG.TEST_DATA.users.families.slice(0, 300),
      ...K6_CONFIG.TEST_DATA.users.directors.slice(0, 50),
      ...K6_CONFIG.TEST_DATA.users.venues.slice(0, 30),
    ],
    environment: ENV,
  };
}

// Gradual growth simulation
export function simulateGradualGrowth(data) {
  const user = getRandomUser();
  const currentVUs = __VU;
  
  // Update scaling state
  scalingState.currentUsers = currentVUs;
  
  // Simulate auto-scaling decisions
  handleAutoScaling(currentVUs, 'gradual');
  
  group('Gradual Growth Simulation', () => {
    // Authenticate user
    const token = authenticateUser(user);
    if (!token) {
      errorRateScaling.add(1, { scaling_phase: 'gradual' });
      return;
    }
    
    // Simulate typical user journey with growth considerations
    const startTime = Date.now();
    
    // Core functionality test
    testCoreUserJourney(token, user, 'gradual');
    
    // Monitor performance during scaling
    const totalTime = Date.now() - startTime;
    responseTimeScaling.add(totalTime, { scaling_phase: 'gradual' });
    
    // Calculate throughput
    const throughput = 1000 / totalTime; // requests per second equivalent
    throughputScaling.add(throughput, { scaling_phase: 'gradual' });
    
    // Simulate resource monitoring
    monitorResourceUtilization(currentVUs, 'gradual');
  });
  
  sleep(Math.random() * 2 + 1);
}

// Viral growth simulation
export function simulateViralGrowth(data) {
  const user = getRandomUser();
  const currentVUs = __VU;
  
  // Handle rapid scaling
  handleAutoScaling(currentVUs, 'viral');
  
  group('Viral Growth Simulation', () => {
    const token = authenticateUser(user);
    if (!token) {
      errorRateScaling.add(1, { scaling_phase: 'viral' });
      return;
    }
    
    const startTime = Date.now();
    
    // During viral growth, users may have different behavior patterns
    if (Math.random() < 0.7) { // 70% new users exploring
      testNewUserOnboarding(token, user);
    } else { // 30% existing users with normal usage
      testCoreUserJourney(token, user, 'viral');
    }
    
    const totalTime = Date.now() - startTime;
    responseTimeScaling.add(totalTime, { scaling_phase: 'viral' });
    
    // Monitor for viral growth specific issues
    if (totalTime > 5000) { // Very slow response
      resourceBottlenecks.add(1, { bottleneck_type: 'viral_overload' });
    }
    
    monitorResourceUtilization(currentVUs, 'viral');
  });
  
  // Shorter sleep during viral growth (more active users)
  sleep(Math.random() * 1 + 0.5);
}

// Peak season simulation
export function simulatePeakSeason(data) {
  const user = getRandomUser();
  const currentVUs = __VU;
  
  handleAutoScaling(currentVUs, 'peak_season');
  
  group('Peak Season Simulation', () => {
    const token = authenticateUser(user);
    if (!token) {
      errorRateScaling.add(1, { scaling_phase: 'peak_season' });
      return;
    }
    
    const startTime = Date.now();
    
    // Peak season has different usage patterns
    testSeasonalUserBehavior(token, user);
    
    const totalTime = Date.now() - startTime;
    responseTimeScaling.add(totalTime, { scaling_phase: 'peak_season' });
    
    // Seasonal metrics
    monitorResourceUtilization(currentVUs, 'peak_season');
    
    // Check for seasonal bottlenecks
    if (user.type === 'family' && totalTime > 3000) {
      resourceBottlenecks.add(1, { bottleneck_type: 'family_booking_overload' });
    }
  });
  
  sleep(Math.random() * 2 + 1);
}

// Auto-scaling threshold testing
export function testAutoScalingThresholds(data) {
  const user = getRandomUser();
  const currentRPS = __ITER; // Current iteration as proxy for RPS
  
  group('Auto-scaling Threshold Testing', () => {
    const token = authenticateUser(user);
    if (!token) {
      errorRateScaling.add(1, { test_type: 'autoscaling' });
      return;
    }
    
    // Test API endpoints that trigger auto-scaling
    const criticalEndpoints = [
      `/family/bookings`,
      `/director/clients`,
      `/venue/availability`,
      `/documents/upload`,
      `/analytics/dashboard`,
    ];
    
    const endpoint = criticalEndpoints[Math.floor(Math.random() * criticalEndpoints.length)];
    const startTime = Date.now();
    
    const response = http.get(`${ENV.apiUrl}${endpoint}`, {
      headers: {
        ...K6_CONFIG.HTTP_CONFIG.headers,
        'Authorization': `Bearer ${token}`,
      },
      tags: { endpoint_type: 'autoscaling_test' },
    });
    
    const responseTime = Date.now() - startTime;
    responseTimeScaling.add(responseTime, { test_type: 'autoscaling' });
    
    // Check if this request should trigger scaling
    checkAutoScalingTriggers(currentRPS, responseTime);
    
    check(response, {
      'autoscaling test response ok': (r) => r.status < 500,
      'autoscaling response time acceptable': () => responseTime < 2000,
    });
  });
  
  sleep(0.1); // High frequency for arrival rate testing
}

// Bottleneck identification
export function identifyBottlenecks(data) {
  const user = getRandomUser();
  const currentVUs = __VU;
  
  group('Bottleneck Identification', () => {
    const token = authenticateUser(user);
    if (!token) return;
    
    // Test different system components to identify bottlenecks
    const componentTests = [
      () => testDatabaseBottleneck(token),
      () => testAPIBottleneck(token),
      () => testFileStorageBottleneck(token),
      () => testCacheBottleneck(token),
      () => testNetworkBottleneck(token),
    ];
    
    componentTests.forEach((test, index) => {
      const startTime = Date.now();
      
      try {
        const result = test();
        const duration = Date.now() - startTime;
        
        // Identify potential bottlenecks
        if (duration > 2000) {
          resourceBottlenecks.add(1, { 
            component: getComponentName(index),
            severity: duration > 5000 ? 'critical' : 'warning'
          });
        }
        
        // Update resource metrics
        updateResourceMetrics(getComponentName(index), duration);
        
      } catch (error) {
        resourceBottlenecks.add(1, { 
          component: getComponentName(index),
          severity: 'critical',
          error: error.message 
        });
      }
      
      sleep(0.2);
    });
    
    // Monitor overall system health
    monitorSystemHealth(currentVUs);
  });
  
  sleep(1);
}

// Multi-region scaling simulation
export function simulateMultiRegionScaling(data) {
  const user = getRandomUser();
  const currentVUs = __VU;
  
  // Simulate different regions
  const regions = ['eu-west-1', 'eu-central-1', 'eu-north-1'];
  const region = regions[currentVUs % regions.length];
  
  group('Multi-region Scaling', () => {
    const token = authenticateUser(user);
    if (!token) return;
    
    // Add region-specific latency simulation
    const baseLatency = getRegionLatency(region);
    sleep(baseLatency / 1000); // Convert ms to seconds
    
    const startTime = Date.now();
    
    // Test cross-region functionality
    testCrossRegionFunctionality(token, user, region);
    
    const totalTime = Date.now() - startTime;
    networkLatencyScaling.add(totalTime, { region });
    
    // Monitor region-specific metrics
    monitorRegionMetrics(region, currentVUs);
    
    // Test load balancer efficiency
    const efficiency = calculateLoadBalancerEfficiency(region, currentVUs);
    loadBalancerEfficiency.add(efficiency, { region });
  });
  
  sleep(Math.random() * 2 + 1);
}

// Helper functions

function authenticateUser(user) {
  try {
    const response = http.post(`${ENV.apiUrl}/auth/signin`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: K6_CONFIG.HTTP_CONFIG.headers,
      tags: { operation: 'auth_scaling' },
    });
    
    if (response.status === 200 && response.json('token')) {
      return response.json('token');
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function handleAutoScaling(currentUsers, phase) {
  const previousInstanceCount = scalingState.instanceCount;
  
  // Auto-scaling logic based on user count
  if (currentUsers > 300 && scalingState.instanceCount === 1) {
    scalingState.instanceCount = 2;
    scalingEvents.add(1, { action: 'scale_up', phase });
  } else if (currentUsers > 600 && scalingState.instanceCount === 2) {
    scalingState.instanceCount = 3;
    scalingEvents.add(1, { action: 'scale_up', phase });
  } else if (currentUsers > 900 && scalingState.instanceCount === 3) {
    scalingState.instanceCount = 4;
    scalingEvents.add(1, { action: 'scale_up', phase });
  } else if (currentUsers < 200 && scalingState.instanceCount > 1) {
    scalingState.instanceCount = Math.max(1, scalingState.instanceCount - 1);
    scalingEvents.add(1, { action: 'scale_down', phase });
  }
  
  if (scalingState.instanceCount !== previousInstanceCount) {
    console.log(`🔄 Auto-scaling: ${previousInstanceCount} → ${scalingState.instanceCount} instances (${currentUsers} users)`);
  }
}

function testCoreUserJourney(token, user, phase) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Core journey steps
  const steps = [
    () => http.get(`${ENV.apiUrl}/${user.type}/profile`, { headers }),
    () => http.get(`${ENV.apiUrl}/${user.type}/dashboard`, { headers }),
    () => http.get(`${ENV.apiUrl}/notifications`, { headers }),
  ];
  
  if (user.type === 'family') {
    steps.push(() => http.get(`${ENV.apiUrl}/family/bookings`, { headers }));
    steps.push(() => http.get(`${ENV.apiUrl}/venues?limit=10`, { headers }));
  } else if (user.type === 'director') {
    steps.push(() => http.get(`${ENV.apiUrl}/director/clients`, { headers }));
    steps.push(() => http.get(`${ENV.apiUrl}/director/calendar`, { headers }));
  }
  
  steps.forEach((step, index) => {
    const stepStart = Date.now();
    const response = step();
    const stepTime = Date.now() - stepStart;
    
    check(response, {
      [`step ${index} successful (${phase})`]: (r) => r.status === 200,
      [`step ${index} fast (${phase})`]: () => stepTime < 1000,
    });
    
    sleep(0.1);
  });
}

function testNewUserOnboarding(token, user) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  // Simulate new user onboarding flow
  const onboardingSteps = [
    () => http.get(`${ENV.apiUrl}/onboarding/start`, { headers }),
    () => http.get(`${ENV.apiUrl}/how-it-works`, { headers }),
    () => http.get(`${ENV.apiUrl}/venues?featured=true`, { headers }),
    () => http.get(`${ENV.apiUrl}/directors?nearby=true`, { headers }),
  ];
  
  onboardingSteps.forEach(step => {
    const response = step();
    check(response, {
      'onboarding step successful': (r) => r.status === 200,
    });
    sleep(0.2);
  });
}

function testSeasonalUserBehavior(token, user) {
  // Peak season behavior patterns
  testCoreUserJourney(token, user, 'peak_season');
  
  // Additional seasonal activities
  if (user.type === 'family') {
    // More urgent booking requests during peak season
    const urgentBooking = {
      service_type: 'crematie',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      duration: 60,
      priority: 'urgent',
    };
    
    http.post(`${ENV.apiUrl}/family/bookings`, JSON.stringify(urgentBooking), {
      headers: {
        ...K6_CONFIG.HTTP_CONFIG.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

function monitorResourceUtilization(currentUsers, phase) {
  // Simulate resource monitoring
  const cpuUsage = Math.min(95, (currentUsers / 10) + Math.random() * 10);
  const memoryUsage = Math.min(90, (currentUsers / 12) + Math.random() * 15);
  const dbUsage = Math.min(85, (currentUsers / 15) + Math.random() * 10);
  
  cpuUsageScaling.add(cpuUsage, { phase });
  memoryUsageScaling.add(memoryUsage, { phase });
  databaseConnectionPoolUtilization.add(dbUsage, { phase });
  
  // Calculate overall utilization
  const overallUtilization = (cpuUsage + memoryUsage + dbUsage) / 3;
  instanceUtilization.add(overallUtilization, { phase });
  
  // Detect potential bottlenecks
  if (cpuUsage > 85) {
    resourceBottlenecks.add(1, { bottleneck_type: 'cpu', phase });
  }
  if (memoryUsage > 80) {
    resourceBottlenecks.add(1, { bottleneck_type: 'memory', phase });
  }
  if (dbUsage > 75) {
    resourceBottlenecks.add(1, { bottleneck_type: 'database', phase });
  }
}

function checkAutoScalingTriggers(currentRPS, responseTime) {
  // Auto-scaling trigger conditions
  if (currentRPS > DUTCH_MARKET_CONFIG.SCALING_PARAMETERS.auto_scale_threshold && responseTime > 1000) {
    scalingEvents.add(1, { trigger: 'response_time_threshold' });
  }
  
  if (currentRPS > 100) { // High request rate
    scalingEvents.add(1, { trigger: 'request_rate_threshold' });
  }
}

function testDatabaseBottleneck(token) {
  const response = http.get(`${ENV.apiUrl}/analytics/complex-query?full_scan=true`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '10s',
  });
  
  return response.status < 500;
}

function testAPIBottleneck(token) {
  const response = http.get(`${ENV.apiUrl}/search/complex?deep=true&facets=all`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '10s',
  });
  
  return response.status < 500;
}

function testFileStorageBottleneck(token) {
  const response = http.post(`${ENV.apiUrl}/documents/upload`, JSON.stringify({
    filename: 'large-test-file.pdf',
    size: 5 * 1024 * 1024, // 5MB
    content: 'x'.repeat(1024), // Simulated content
  }), {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '15s',
  });
  
  return response.status < 500;
}

function testCacheBottleneck(token) {
  const response = http.get(`${ENV.apiUrl}/cache/heavy-computation?no_cache=true`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '8s',
  });
  
  return response.status < 500;
}

function testNetworkBottleneck(token) {
  const response = http.get(`${ENV.apiUrl}/large-payload?size=1mb`, {
    headers: {
      ...K6_CONFIG.HTTP_CONFIG.headers,
      'Authorization': `Bearer ${token}`,
    },
    timeout: '10s',
  });
  
  return response.status < 500;
}

function getComponentName(index) {
  const components = ['database', 'api', 'file_storage', 'cache', 'network'];
  return components[index] || 'unknown';
}

function updateResourceMetrics(component, duration) {
  scalingState.resourceMetrics[component] = duration;
}

function monitorSystemHealth(currentUsers) {
  const healthScore = calculateSystemHealthScore(currentUsers);
  
  if (healthScore < 70) {
    resourceBottlenecks.add(1, { bottleneck_type: 'system_health', score: healthScore });
  }
}

function calculateSystemHealthScore(users) {
  // Simple health score calculation
  const baseScore = 100;
  const userPenalty = Math.max(0, (users - 500) * 0.05); // Penalty for high user count
  const resourcePenalty = Object.values(scalingState.resourceMetrics)
    .reduce((sum, metric) => sum + Math.max(0, metric - 1000) * 0.01, 0);
  
  return Math.max(0, baseScore - userPenalty - resourcePenalty);
}

function testCrossRegionFunctionality(token, user, region) {
  const headers = {
    ...K6_CONFIG.HTTP_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
    'X-Region': region,
  };
  
  // Test region-specific endpoints
  const response = http.get(`${ENV.apiUrl}/region/${region}/status`, { headers });
  
  check(response, {
    'cross-region functionality works': (r) => r.status === 200,
  });
}

function getRegionLatency(region) {
  const latencies = {
    'eu-west-1': 50, // 50ms base latency
    'eu-central-1': 30, // 30ms base latency
    'eu-north-1': 70, // 70ms base latency
  };
  
  return latencies[region] || 50;
}

function monitorRegionMetrics(region, users) {
  const regionLoad = users / 3; // Assuming 3 regions
  const latency = getRegionLatency(region) + (regionLoad * 0.1);
  
  networkLatencyScaling.add(latency, { region });
}

function calculateLoadBalancerEfficiency(region, users) {
  // Simple efficiency calculation
  const maxCapacity = 400; // Max users per region
  const utilization = Math.min(100, (users / maxCapacity) * 100);
  
  // Efficiency decreases as utilization increases
  return Math.max(50, 100 - (utilization * 0.3));
}

export function teardown(data) {
  console.log('📈 Horizontal scaling & scalability testing completed');
  console.log(`📊 Final state:`);
  console.log(`  - Instance count: ${scalingState.instanceCount}`);
  console.log(`  - Scaling events: ${scalingState.scalingEvents.length}`);
  console.log(`  - Bottlenecks detected: ${scalingState.bottlenecks.length}`);
  
  console.log('📈 Performance analysis:');
  console.log('  - Resource utilization patterns');
  console.log('  - Auto-scaling effectiveness');
  console.log('  - Bottleneck identification');
  console.log('  - Multi-region performance');
  
  console.log('🎯 Recommendations:');
  console.log('  - Check auto-scaling thresholds');
  console.log('  - Optimize identified bottlenecks');
  console.log('  - Review resource allocation');
  console.log('  - Plan for growth patterns');
  
  console.log('✅ Scalability test teardown complete');
}