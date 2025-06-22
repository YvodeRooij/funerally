/**
 * WEBSOCKET REAL-TIME PERFORMANCE TESTING - FAREWELLY PLATFORM
 * 
 * Tests WebSocket message throughput, concurrent connections, and real-time features
 * Focuses on chat, notifications, and collaborative features performance
 */

import ws from 'k6/ws';
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { K6_CONFIG, getEnvironmentConfig, getRandomUser } from '../config/k6-config.js';
import { DUTCH_MARKET_CONFIG } from '../config/dutch-market-parameters.js';

// WebSocket performance metrics
const wsConnectionDuration = new Trend('ws_connection_duration');
const wsConnectionSuccess = new Rate('ws_connection_success');
const wsMessageLatency = new Trend('ws_message_latency');
const wsMessageThroughput = new Rate('ws_message_throughput');
const wsConcurrentConnections = new Gauge('ws_concurrent_connections');
const wsConnectionDrops = new Counter('ws_connection_drops');
const wsReconnectAttempts = new Counter('ws_reconnect_attempts');
const wsAuthFailures = new Counter('ws_auth_failures');
const notificationDeliveryTime = new Trend('notification_delivery_time');
const chatMessageDeliveryTime = new Trend('chat_message_delivery_time');
const presenceUpdateLatency = new Trend('presence_update_latency');

// Environment configuration
const ENV = getEnvironmentConfig(__ENV.ENVIRONMENT || 'development');
const WS_URL = ENV.wsUrl || 'ws://localhost:3000';

// WebSocket testing options
export const options = {
  scenarios: {
    // Basic WebSocket connection test
    basic_websocket_test: {
      executor: 'ramping-vus',
      exec: 'testBasicWebSocket',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      tags: { ws_test_type: 'basic' },
    },
    
    // High concurrent connections test
    concurrent_connections_test: {
      executor: 'ramping-vus',
      exec: 'testConcurrentConnections',
      startTime: '10m',
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '3m', target: 500 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      tags: { ws_test_type: 'concurrent' },
    },
    
    // Message throughput test
    message_throughput_test: {
      executor: 'constant-vus',
      exec: 'testMessageThroughput',
      startTime: '20m',
      vus: 200,
      duration: '10m',
      tags: { ws_test_type: 'throughput' },
    },
    
    // Chat performance test
    chat_performance_test: {
      executor: 'ramping-vus',
      exec: 'testChatPerformance',
      startTime: '31m',
      stages: [
        { duration: '2m', target: 100 },
        { duration: '8m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      tags: { ws_test_type: 'chat' },
    },
    
    // Notification delivery test
    notification_delivery_test: {
      executor: 'constant-arrival-rate',
      exec: 'testNotificationDelivery',
      startTime: '44m',
      rate: 100, // notifications per second
      timeUnit: '1s',
      duration: '8m',
      preAllocatedVUs: 50,
      maxVUs: 150,
      tags: { ws_test_type: 'notifications' },
    },
    
    // Presence and collaboration test
    presence_collaboration_test: {
      executor: 'constant-vus',
      exec: 'testPresenceAndCollaboration',
      startTime: '53m',
      vus: 150,
      duration: '10m',
      tags: { ws_test_type: 'presence' },
    },
    
    // Connection stability test (long duration)
    connection_stability_test: {
      executor: 'constant-vus',
      exec: 'testConnectionStability',
      startTime: '64m',
      vus: 100,
      duration: '20m',
      tags: { ws_test_type: 'stability' },
    },
  },
  
  thresholds: {
    'ws_connection_duration': [
      { threshold: 'p(95)<1000', abortOnFail: false }, // 95% under 1s
    ],
    'ws_connection_success': [
      { threshold: 'rate>0.99', abortOnFail: true }, // 99% success rate
    ],
    'ws_message_latency': [
      { threshold: 'p(95)<200', abortOnFail: false }, // 95% under 200ms
      { threshold: 'p(99)<500', abortOnFail: false }, // 99% under 500ms
    ],
    'ws_concurrent_connections': [
      { threshold: 'value<600', abortOnFail: false }, // Max 600 concurrent
    ],
    'ws_connection_drops': [
      { threshold: 'count<50', abortOnFail: false }, // Less than 50 drops
    ],
    'notification_delivery_time': [
      { threshold: 'p(95)<300', abortOnFail: false }, // 95% under 300ms
    ],
    'chat_message_delivery_time': [
      { threshold: 'p(95)<150', abortOnFail: false }, // 95% under 150ms
    ],
    'presence_update_latency': [
      { threshold: 'p(95)<100', abortOnFail: false }, // 95% under 100ms
    ],
  },
  
  tags: {
    ...K6_CONFIG.MONITORING.tags,
    test_category: 'websocket',
  },
};

// Global WebSocket state
let wsConnections = new Map();
let messageQueues = new Map();
let connectionCounter = 0;

export function setup() {
  console.log('🔌 Starting WebSocket performance testing...');
  console.log(`🌐 WebSocket URL: ${WS_URL}`);
  console.log('🎯 Testing: Connection stability, message throughput, real-time features');
  
  return {
    testUsers: [
      ...K6_CONFIG.TEST_DATA.users.families.slice(0, 100),
      ...K6_CONFIG.TEST_DATA.users.directors.slice(0, 30),
      ...K6_CONFIG.TEST_DATA.users.venues.slice(0, 20),
    ],
    environment: ENV,
  };
}

// Basic WebSocket connection test
export function testBasicWebSocket(data) {
  const user = getRandomUser();
  const connectionId = `conn_${++connectionCounter}`;
  
  group('Basic WebSocket Connection', () => {
    const startTime = Date.now();
    
    const url = `${WS_URL}/ws?user_id=${user.id}&user_type=${user.type}`;
    
    const response = ws.connect(url, {
      ...K6_CONFIG.WS_CONFIG,
      tags: { connection_id: connectionId, user_type: user.type },
    }, function (socket) {
      const connectionTime = Date.now() - startTime;
      wsConnectionDuration.add(connectionTime);
      wsConnectionSuccess.add(1);
      wsConcurrentConnections.add(1);
      
      wsConnections.set(connectionId, {
        socket,
        user,
        connected: true,
        messages: [],
      });
      
      // Set up message handlers
      socket.on('open', () => {
        console.log(`✅ WebSocket connected: ${connectionId}`);
        
        // Send authentication
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
          user_id: user.id,
        }));
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        handleWebSocketMessage(connectionId, message);
      });
      
      socket.on('close', () => {
        console.log(`❌ WebSocket closed: ${connectionId}`);
        wsConnections.delete(connectionId);
        wsConcurrentConnections.add(-1);
        wsConnectionDrops.add(1);
      });
      
      socket.on('error', (error) => {
        console.error(`🚨 WebSocket error ${connectionId}:`, error);
        wsConnectionDrops.add(1);
      });
      
      // Basic connectivity test
      performBasicConnectivityTest(socket, connectionId);
      
      // Keep connection alive for test duration
      socket.setTimeout(() => {
        socket.close();
      }, 30000); // 30 seconds
    });
    
    check(response, {
      'websocket connection successful': (r) => r && r.status === 101,
    });
  });
  
  sleep(Math.random() * 2 + 1);
}

// Concurrent connections test
export function testConcurrentConnections(data) {
  const user = getRandomUser();
  const connectionId = `concurrent_${++connectionCounter}`;
  
  group('Concurrent WebSocket Connections', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&user_type=${user.type}&test=concurrent`;
    
    const response = ws.connect(url, {
      ...K6_CONFIG.WS_CONFIG,
      tags: { connection_id: connectionId, test_type: 'concurrent' },
    }, function (socket) {
      wsConnectionSuccess.add(1);
      wsConcurrentConnections.add(1);
      
      socket.on('open', () => {
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Subscribe to channels based on user type
        subscribeToChannels(socket, user);
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        // Track message handling for concurrent connections
        if (message.type === 'channel_subscribed') {
          console.log(`📢 Channel subscribed: ${message.channel}`);
        }
      });
      
      socket.on('close', () => {
        wsConcurrentConnections.add(-1);
      });
      
      // Simulate user activity while connected
      simulateUserActivity(socket, user, connectionId);
      
      // Hold connection for longer during concurrent test
      socket.setTimeout(() => {
        socket.close();
      }, 45000); // 45 seconds
    });
  });
  
  sleep(Math.random() * 3 + 2);
}

// Message throughput test
export function testMessageThroughput(data) {
  const user = getRandomUser();
  const connectionId = `throughput_${++connectionCounter}`;
  
  group('Message Throughput Test', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&test=throughput`;
    
    ws.connect(url, K6_CONFIG.WS_CONFIG, function (socket) {
      wsConnectionSuccess.add(1);
      
      let messagesSent = 0;
      let messagesReceived = 0;
      let startTime = Date.now();
      
      socket.on('open', () => {
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Start high-frequency message sending
        const messageInterval = socket.setInterval(() => {
          const message = {
            type: 'throughput_test',
            sequence: messagesSent++,
            timestamp: Date.now(),
            data: generateTestMessage(),
          };
          
          socket.send(JSON.stringify(message));
          
          if (messagesSent >= 100) { // Send 100 messages
            socket.clearInterval(messageInterval);
          }
        }, 50); // Every 50ms = 20 messages per second per connection
      });
      
      socket.on('message', (data) => {
        messagesReceived++;
        const message = JSON.parse(data);
        
        if (message.type === 'throughput_response') {
          const latency = Date.now() - message.original_timestamp;
          wsMessageLatency.add(latency);
        }
        
        // Calculate throughput
        if (messagesReceived % 10 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const throughput = messagesReceived / elapsed;
          wsMessageThroughput.add(throughput);
        }
      });
      
      socket.setTimeout(() => {
        console.log(`📊 Throughput test ${connectionId}: Sent ${messagesSent}, Received ${messagesReceived}`);
        socket.close();
      }, 30000);
    });
  });
  
  sleep(1);
}

// Chat performance test
export function testChatPerformance(data) {
  const user = getRandomUser('family'); // Focus on family users for chat
  const connectionId = `chat_${++connectionCounter}`;
  
  group('Chat Performance Test', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&feature=chat`;
    
    ws.connect(url, K6_CONFIG.WS_CONFIG, function (socket) {
      wsConnectionSuccess.add(1);
      
      let chatRoomId = null;
      
      socket.on('open', () => {
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Join a chat room
        socket.send(JSON.stringify({
          type: 'join_room',
          roomId: `family-director-${Math.floor(Math.random() * 100)}`,
        }));
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'room_joined') {
          chatRoomId = message.roomId;
          
          // Start sending chat messages
          simulateChatConversation(socket, chatRoomId);
        }
        
        if (message.type === 'chat_message') {
          const deliveryTime = Date.now() - message.sent_at;
          chatMessageDeliveryTime.add(deliveryTime);
          
          // Simulate reading and responding
          if (Math.random() < 0.3) { // 30% chance to respond
            setTimeout(() => {
              sendChatMessage(socket, chatRoomId, generateChatResponse());
            }, Math.random() * 2000 + 500); // 0.5-2.5s response time
          }
        }
      });
      
      socket.setTimeout(() => {
        if (chatRoomId) {
          socket.send(JSON.stringify({
            type: 'leave_room',
            roomId: chatRoomId,
          }));
        }
        socket.close();
      }, 40000);
    });
  });
  
  sleep(Math.random() * 3 + 1);
}

// Notification delivery test
export function testNotificationDelivery(data) {
  const user = getRandomUser();
  const connectionId = `notification_${++connectionCounter}`;
  
  group('Notification Delivery Test', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&feature=notifications`;
    
    ws.connect(url, K6_CONFIG.WS_CONFIG, function (socket) {
      wsConnectionSuccess.add(1);
      
      socket.on('open', () => {
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Subscribe to notification channels
        socket.send(JSON.stringify({
          type: 'subscribe',
          channels: [
            `user-notifications-${user.id}`,
            `${user.type}-notifications`,
            'system-notifications',
          ],
        }));
        
        // Trigger some notifications via API
        triggerTestNotifications(user);
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'notification') {
          const deliveryTime = Date.now() - message.created_at;
          notificationDeliveryTime.add(deliveryTime);
          
          // Acknowledge notification
          socket.send(JSON.stringify({
            type: 'notification_ack',
            notificationId: message.id,
          }));
        }
      });
      
      socket.setTimeout(() => {
        socket.close();
      }, 25000);
    });
  });
  
  sleep(0.5);
}

// Presence and collaboration test
export function testPresenceAndCollaboration(data) {
  const user = getRandomUser();
  const connectionId = `presence_${++connectionCounter}`;
  
  group('Presence and Collaboration Test', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&feature=presence`;
    
    ws.connect(url, K6_CONFIG.WS_CONFIG, function (socket) {
      wsConnectionSuccess.add(1);
      
      socket.on('open', () => {
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Join presence channel
        socket.send(JSON.stringify({
          type: 'presence_join',
          channel: `presence-${user.type}-users`,
        }));
        
        // Update presence status
        updatePresenceStatus(socket, 'online');
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'presence_update') {
          const latency = Date.now() - message.timestamp;
          presenceUpdateLatency.add(latency);
        }
        
        if (message.type === 'user_joined') {
          console.log(`👋 User joined: ${message.user_id}`);
        }
        
        if (message.type === 'user_left') {
          console.log(`👋 User left: ${message.user_id}`);
        }
      });
      
      // Simulate active collaboration
      const presenceInterval = socket.setInterval(() => {
        const activities = ['viewing_dashboard', 'editing_booking', 'reading_messages', 'uploading_document'];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        
        socket.send(JSON.stringify({
          type: 'presence_activity',
          activity,
          timestamp: Date.now(),
        }));
      }, 5000); // Every 5 seconds
      
      socket.setTimeout(() => {
        socket.clearInterval(presenceInterval);
        updatePresenceStatus(socket, 'offline');
        socket.close();
      }, 35000);
    });
  });
  
  sleep(Math.random() * 2 + 1);
}

// Connection stability test
export function testConnectionStability(data) {
  const user = getRandomUser();
  const connectionId = `stability_${++connectionCounter}`;
  
  group('Connection Stability Test', () => {
    const url = `${WS_URL}/ws?user_id=${user.id}&test=stability`;
    
    ws.connect(url, K6_CONFIG.WS_CONFIG, function (socket) {
      wsConnectionSuccess.add(1);
      
      let isConnected = true;
      let reconnectCount = 0;
      let messageCount = 0;
      
      socket.on('open', () => {
        isConnected = true;
        console.log(`🔗 Long-term connection established: ${connectionId}`);
        
        // Authenticate
        socket.send(JSON.stringify({
          type: 'auth',
          token: generateMockToken(user),
        }));
        
        // Send periodic heartbeat messages
        const heartbeatInterval = socket.setInterval(() => {
          if (isConnected) {
            socket.send(JSON.stringify({
              type: 'heartbeat',
              timestamp: Date.now(),
            }));
            messageCount++;
          }
        }, 10000); // Every 10 seconds
        
        // Simulate network fluctuations
        simulateNetworkFluctuations(socket, connectionId);
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        
        if (message.type === 'heartbeat_ack') {
          const latency = Date.now() - message.original_timestamp;
          wsMessageLatency.add(latency, { test_type: 'stability' });
        }
      });
      
      socket.on('close', () => {
        isConnected = false;
        console.log(`❌ Connection lost: ${connectionId}, attempting reconnect...`);
        wsConnectionDrops.add(1);
        
        // Attempt reconnection (in real implementation)
        reconnectCount++;
        wsReconnectAttempts.add(1);
      });
      
      socket.on('error', (error) => {
        console.error(`🚨 Connection error ${connectionId}:`, error);
        isConnected = false;
      });
      
      // Hold connection for the full duration
      socket.setTimeout(() => {
        console.log(`📊 Stability test ${connectionId}: Messages sent ${messageCount}, Reconnects ${reconnectCount}`);
        socket.close();
      }, 120000); // 2 minutes
    });
  });
  
  sleep(2);
}

// Helper functions

function handleWebSocketMessage(connectionId, message) {
  const connection = wsConnections.get(connectionId);
  if (!connection) return;
  
  connection.messages.push({
    ...message,
    received_at: Date.now(),
  });
  
  // Calculate message latency if timestamp is available
  if (message.timestamp) {
    const latency = Date.now() - message.timestamp;
    wsMessageLatency.add(latency);
  }
}

function performBasicConnectivityTest(socket, connectionId) {
  // Send test message
  const testMessage = {
    type: 'connectivity_test',
    connectionId,
    timestamp: Date.now(),
  };
  
  setTimeout(() => {
    socket.send(JSON.stringify(testMessage));
  }, 1000);
}

function subscribeToChannels(socket, user) {
  const channels = [];
  
  switch (user.type) {
    case 'family':
      channels.push(
        `family-notifications-${user.id}`,
        `family-bookings-${user.id}`,
        `family-documents-${user.id}`
      );
      break;
    case 'director':
      channels.push(
        `director-notifications-${user.id}`,
        `director-clients-${user.id}`,
        `director-bookings-${user.id}`
      );
      break;
    case 'venue':
      channels.push(
        `venue-notifications-${user.id}`,
        `venue-bookings-${user.id}`,
        `venue-availability-${user.id}`
      );
      break;
  }
  
  socket.send(JSON.stringify({
    type: 'subscribe_channels',
    channels,
  }));
}

function simulateUserActivity(socket, user, connectionId) {
  const activities = [
    () => socket.send(JSON.stringify({ type: 'page_view', page: 'dashboard' })),
    () => socket.send(JSON.stringify({ type: 'user_activity', action: 'scroll' })),
    () => socket.send(JSON.stringify({ type: 'typing_indicator', room_id: 'test_room' })),
    () => socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() })),
  ];
  
  const activityInterval = socket.setInterval(() => {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    activity();
  }, Math.random() * 5000 + 2000); // 2-7 seconds
  
  setTimeout(() => {
    socket.clearInterval(activityInterval);
  }, 40000);
}

function generateTestMessage() {
  return {
    content: K6_CONFIG.TEST_DATA.chatMessages[
      Math.floor(Math.random() * K6_CONFIG.TEST_DATA.chatMessages.length)
    ],
    user_id: Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
  };
}

function simulateChatConversation(socket, roomId) {
  let messageCount = 0;
  
  const conversationInterval = socket.setInterval(() => {
    if (messageCount >= 10) { // Send 10 messages
      socket.clearInterval(conversationInterval);
      return;
    }
    
    const message = K6_CONFIG.TEST_DATA.chatMessages[
      Math.floor(Math.random() * K6_CONFIG.TEST_DATA.chatMessages.length)
    ];
    
    sendChatMessage(socket, roomId, message);
    messageCount++;
  }, Math.random() * 3000 + 1000); // 1-4 seconds between messages
}

function sendChatMessage(socket, roomId, content) {
  const message = {
    type: 'send_message',
    roomId,
    content,
    timestamp: Date.now(),
  };
  
  socket.send(JSON.stringify(message));
}

function generateChatResponse() {
  const responses = [
    'Dank je wel voor de informatie.',
    'Dat klinkt goed.',
    'Kunnen we dit later bespreken?',
    'Ik zal dit doorgeven aan de familie.',
    'Prima, dan regelen we dat.',
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function triggerTestNotifications(user) {
  // Trigger notifications via HTTP API
  const notifications = [
    { type: 'booking_update', title: 'Booking Updated', message: 'Your booking has been confirmed' },
    { type: 'document_uploaded', title: 'Document Ready', message: 'A new document has been uploaded' },
    { type: 'message_received', title: 'New Message', message: 'You have received a new message' },
  ];
  
  notifications.forEach((notification, index) => {
    setTimeout(() => {
      http.post(`${ENV.apiUrl}/notifications/trigger`, JSON.stringify({
        user_id: user.id,
        ...notification,
        created_at: Date.now(),
      }), {
        headers: K6_CONFIG.HTTP_CONFIG.headers,
      });
    }, index * 2000); // Stagger notifications
  });
}

function updatePresenceStatus(socket, status) {
  socket.send(JSON.stringify({
    type: 'presence_update',
    status,
    timestamp: Date.now(),
  }));
}

function simulateNetworkFluctuations(socket, connectionId) {
  // Simulate occasional network issues
  setTimeout(() => {
    if (Math.random() < 0.1) { // 10% chance of network issue
      console.log(`🌐 Simulating network fluctuation for ${connectionId}`);
      // In a real scenario, this might cause temporary connection issues
    }
  }, Math.random() * 60000 + 30000); // Between 30s and 90s
}

function generateMockToken(user) {
  // Generate a mock JWT token for testing
  return `mock_token_${user.id}_${Date.now()}`;
}

export function teardown(data) {
  console.log('🔌 WebSocket performance testing completed');
  console.log(`📊 Active connections at end: ${wsConnections.size}`);
  console.log('📈 Check metrics for:');
  console.log('  - Connection success rate and duration');
  console.log('  - Message latency and throughput');
  console.log('  - Concurrent connection handling');
  console.log('  - Real-time feature performance');
  console.log('  - Connection stability and recovery');
  
  // Clean up any remaining connections
  wsConnections.clear();
  
  console.log('✅ WebSocket test teardown complete');
}