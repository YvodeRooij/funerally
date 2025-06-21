/**
 * REAL-TIME CONFIGURATION - CORE SETTINGS
 * 
 * Purpose: Centralized configuration for real-time communication
 * Features: WebSocket settings, Pusher configuration, environment management
 * Architecture: Flexible provider system supporting multiple real-time services
 */

export interface RealtimeConfig {
  provider: 'pusher' | 'websocket' | 'socketio'
  reconnect: boolean
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  connectionTimeout: number
  enableLogging: boolean
  enableMetrics: boolean
}

export interface PusherConfig {
  appId: string
  key: string
  secret: string
  cluster: string
  useTLS: boolean
  enabledTransports?: string[]
  disabledTransports?: string[]
}

export interface WebSocketConfig {
  url: string
  protocols?: string[]
  headers?: Record<string, string>
  origin?: string
}

// Default real-time configuration
export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  provider: 'pusher',
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
}

// Pusher configuration
export const PUSHER_CONFIG: PusherConfig = {
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  useTLS: true,
  enabledTransports: ['ws', 'wss'],
}

// WebSocket configuration
export const WEBSOCKET_CONFIG: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
  protocols: ['farewelly-protocol'],
  headers: {
    'User-Agent': 'Farewelly/1.0',
  },
}

// Channel naming conventions
export const CHANNELS = {
  // Family-Director communication
  FAMILY_DIRECTOR_CHAT: (familyId: string, directorId: string) => 
    `family-director-${familyId}-${directorId}`,
  
  // Family-specific channels
  FAMILY_NOTIFICATIONS: (familyId: string) => `family-notifications-${familyId}`,
  FAMILY_DOCUMENTS: (familyId: string) => `family-documents-${familyId}`,
  FAMILY_PLANNING: (familyId: string) => `family-planning-${familyId}`,
  
  // Director-specific channels
  DIRECTOR_NOTIFICATIONS: (directorId: string) => `director-notifications-${directorId}`,
  DIRECTOR_CLIENTS: (directorId: string) => `director-clients-${directorId}`,
  
  // Venue-specific channels
  VENUE_BOOKINGS: (venueId: string) => `venue-bookings-${venueId}`,
  VENUE_AVAILABILITY: (venueId: string) => `venue-availability-${venueId}`,
  
  // Presence channels
  USER_PRESENCE: (userId: string) => `presence-user-${userId}`,
  CHAT_PRESENCE: (chatId: string) => `presence-chat-${chatId}`,
  
  // System-wide channels
  SYSTEM_ANNOUNCEMENTS: 'system-announcements',
  SYSTEM_MAINTENANCE: 'system-maintenance',
} as const

// Event types
export const EVENTS = {
  // Connection events
  CONNECTION_OPENED: 'connection:opened',
  CONNECTION_CLOSED: 'connection:closed',
  CONNECTION_ERROR: 'connection:error',
  
  // Chat events
  MESSAGE_SENT: 'chat:message:sent',
  MESSAGE_RECEIVED: 'chat:message:received',
  MESSAGE_TYPING: 'chat:typing',
  MESSAGE_STOP_TYPING: 'chat:stop-typing',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_CLEARED: 'notification:cleared',
  
  // Document events
  DOCUMENT_UPLOADED: 'document:uploaded',
  DOCUMENT_UPDATED: 'document:updated',
  DOCUMENT_SHARED: 'document:shared',
  DOCUMENT_REVIEWED: 'document:reviewed',
  
  // Planning events
  PLANNING_UPDATED: 'planning:updated',
  PLANNING_TASK_ADDED: 'planning:task:added',
  PLANNING_TASK_COMPLETED: 'planning:task:completed',
  
  // Presence events
  USER_ONLINE: 'presence:user:online',
  USER_OFFLINE: 'presence:user:offline',
  USER_TYPING: 'presence:user:typing',
  
  // Booking events
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CONFIRMED: 'booking:confirmed',
  BOOKING_CANCELLED: 'booking:cancelled',
  
  // System events
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
} as const

// Rate limiting configuration
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 60,
  NOTIFICATIONS_PER_MINUTE: 30,
  TYPING_EVENTS_PER_MINUTE: 120,
  CONNECTION_ATTEMPTS_PER_HOUR: 10,
} as const

// Message size limits
export const MESSAGE_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
} as const

// Validation helpers
export const validateConfig = (config: Partial<RealtimeConfig>): boolean => {
  if (config.reconnectInterval && config.reconnectInterval < 1000) {
    console.warn('Reconnect interval should be at least 1000ms')
    return false
  }
  
  if (config.maxReconnectAttempts && config.maxReconnectAttempts < 1) {
    console.warn('Max reconnect attempts should be at least 1')
    return false
  }
  
  if (config.heartbeatInterval && config.heartbeatInterval < 10000) {
    console.warn('Heartbeat interval should be at least 10000ms')
    return false
  }
  
  return true
}

export const validatePusherConfig = (config: PusherConfig): boolean => {
  if (!config.appId || !config.key || !config.secret) {
    console.error('Pusher configuration is incomplete')
    return false
  }
  
  if (!config.cluster) {
    console.warn('Pusher cluster not specified, using default')
  }
  
  return true
}

// Environment-specific configurations
export const getEnvironmentConfig = (): Partial<RealtimeConfig> => {
  const env = process.env.NODE_ENV

  switch (env) {
    case 'development':
      return {
        enableLogging: true,
        reconnectInterval: 2000,
        heartbeatInterval: 15000,
      }
    
    case 'staging':
      return {
        enableLogging: true,
        reconnectInterval: 3000,
        heartbeatInterval: 20000,
      }
    
    case 'production':
      return {
        enableLogging: false,
        reconnectInterval: 5000,
        heartbeatInterval: 30000,
      }
    
    default:
      return DEFAULT_REALTIME_CONFIG
  }
}

// Feature flags for real-time features
export const FEATURE_FLAGS = {
  ENABLE_CHAT: process.env.NEXT_PUBLIC_ENABLE_CHAT !== 'false',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_PRESENCE: process.env.NEXT_PUBLIC_ENABLE_PRESENCE !== 'false',
  ENABLE_COLLABORATIVE_EDITING: process.env.NEXT_PUBLIC_ENABLE_COLLABORATIVE_EDITING === 'true',
  ENABLE_DOCUMENT_SHARING: process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_SHARING !== 'false',
  ENABLE_REAL_TIME_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_ANALYTICS === 'true',
} as const