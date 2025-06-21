/**
 * REAL-TIME TYPES - TYPE DEFINITIONS
 * 
 * Purpose: Comprehensive type definitions for real-time communication
 * Features: Strong typing for events, messages, presence, and state management
 * Architecture: Modular type system supporting all real-time features
 */

// Base types
export type UserId = string
export type FamilyId = string
export type DirectorId = string
export type VenueId = string
export type ChatId = string
export type MessageId = string
export type NotificationId = string
export type DocumentId = string
export type PlanningId = string

// User roles
export type UserRole = 'family' | 'director' | 'venue' | 'admin'

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

// Real-time event base interface
export interface RealtimeEvent<T = unknown> {
  type: string
  timestamp: string
  userId?: UserId
  sessionId?: string
  data: T
  metadata?: Record<string, unknown>
}

// Connection events
export interface ConnectionEvent extends RealtimeEvent {
  type: 'connection:opened' | 'connection:closed' | 'connection:error'
  data: {
    status: ConnectionStatus
    reason?: string
    reconnectAttempt?: number
  }
}

// Chat message types
export interface ChatMessage {
  id: MessageId
  chatId: ChatId
  senderId: UserId
  senderName: string
  senderRole: UserRole
  content: string
  type: 'text' | 'image' | 'document' | 'audio' | 'system'
  timestamp: string
  editedAt?: string
  readBy: Array<{
    userId: UserId
    readAt: string
  }>
  attachments?: MessageAttachment[]
  replyTo?: MessageId
  reactions?: MessageReaction[]
  status: 'sending' | 'sent' | 'delivered' | 'failed'
}

export interface MessageAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface MessageReaction {
  emoji: string
  userId: UserId
  userName: string
  timestamp: string
}

// Chat events
export interface ChatMessageEvent extends RealtimeEvent<ChatMessage> {
  type: 'chat:message:sent' | 'chat:message:received'
}

export interface ChatTypingEvent extends RealtimeEvent {
  type: 'chat:typing' | 'chat:stop-typing'
  data: {
    chatId: ChatId
    userId: UserId
    userName: string
    isTyping: boolean
  }
}

// Notification types
export interface Notification {
  id: NotificationId
  type: 'urgent' | 'reminder' | 'update' | 'message' | 'payment' | 'document' | 'booking'
  title: string
  message: string
  timestamp: string
  userId: UserId
  read: boolean
  actionUrl?: string
  actionText?: string
  data?: Record<string, unknown>
  expiresAt?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface NotificationEvent extends RealtimeEvent<Notification> {
  type: 'notification:new' | 'notification:read' | 'notification:cleared'
}

// Presence types
export interface UserPresence {
  userId: UserId
  userName: string
  userRole: UserRole
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: string
  currentPage?: string
  isTyping?: boolean
  typingIn?: ChatId[]
}

export interface PresenceEvent extends RealtimeEvent {
  type: 'presence:user:online' | 'presence:user:offline' | 'presence:user:typing'
  data: {
    userId: UserId
    presence: UserPresence
    chatId?: ChatId
  }
}

// Document types
export interface DocumentInfo {
  id: DocumentId
  name: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedBy: UserId
  uploadedAt: string
  category: 'certificate' | 'form' | 'image' | 'audio' | 'video' | 'other'
  status: 'pending' | 'processing' | 'approved' | 'rejected'
  sharedWith: UserId[]
  version: number
  tags?: string[]
}

export interface DocumentEvent extends RealtimeEvent {
  type: 'document:uploaded' | 'document:updated' | 'document:shared' | 'document:reviewed'
  data: {
    document: DocumentInfo
    action: string
    previousVersion?: number
    reviewer?: UserId
    comments?: string
  }
}

// Collaborative planning types
export interface PlanningTask {
  id: string
  title: string
  description?: string
  assignedTo?: UserId
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  category: 'ceremony' | 'logistics' | 'documentation' | 'communication' | 'payment'
  createdBy: UserId
  createdAt: string
  updatedAt: string
  completedAt?: string
  attachments?: DocumentInfo[]
  comments?: PlanningComment[]
}

export interface PlanningComment {
  id: string
  taskId: string
  userId: UserId
  userName: string
  content: string
  timestamp: string
  editedAt?: string
}

export interface Planning {
  id: PlanningId
  familyId: FamilyId
  directorId: DirectorId
  title: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  tasks: PlanningTask[]
  timeline?: Array<{
    date: string
    title: string
    description?: string
    type: 'milestone' | 'deadline' | 'event'
  }>
  collaborators: Array<{
    userId: UserId
    role: 'owner' | 'editor' | 'viewer'
    addedAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface PlanningEvent extends RealtimeEvent {
  type: 'planning:updated' | 'planning:task:added' | 'planning:task:completed'
  data: {
    planning: Planning
    task?: PlanningTask
    action: string
    changedBy: UserId
  }
}

// Booking types
export interface Booking {
  id: string
  familyId: FamilyId
  directorId: DirectorId
  venueId: VenueId
  type: 'ceremony' | 'memorial' | 'wake' | 'burial' | 'cremation'
  datetime: string
  duration: number // in minutes
  attendees: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  requirements?: string[]
  cost?: {
    base: number
    extras: Array<{
      name: string
      cost: number
    }>
    total: number
  }
  createdAt: string
  updatedAt: string
}

export interface BookingEvent extends RealtimeEvent {
  type: 'booking:created' | 'booking:updated' | 'booking:confirmed' | 'booking:cancelled'
  data: {
    booking: Booking
    action: string
    changedBy: UserId
    reason?: string
  }
}

// System events
export interface SystemEvent extends RealtimeEvent {
  type: 'system:maintenance' | 'system:announcement'
  data: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error'
    scheduledFor?: string
    duration?: number
    affectedServices?: string[]
  }
}

// Real-time client state
export interface RealtimeState {
  connection: {
    status: ConnectionStatus
    lastConnected?: string
    reconnectAttempts: number
    error?: string
  }
  presence: {
    currentUser?: UserPresence
    users: Map<UserId, UserPresence>
    typing: Map<ChatId, UserId[]>
  }
  chats: {
    active: Map<ChatId, ChatMessage[]>
    unreadCounts: Map<ChatId, number>
    typing: Map<ChatId, UserId[]>
  }
  notifications: {
    items: Notification[]
    unreadCount: number
    lastFetched?: string
  }
  planning: {
    active: Map<PlanningId, Planning>
    updates: Array<{
      planningId: PlanningId
      timestamp: string
      type: string
    }>
  }
  documents: {
    recent: DocumentInfo[]
    shared: DocumentInfo[]
    pending: DocumentInfo[]
  }
}

// Event handler types
export type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void | Promise<void>

export interface EventHandlers {
  // Connection handlers
  'connection:opened'?: EventHandler<ConnectionEvent['data']>
  'connection:closed'?: EventHandler<ConnectionEvent['data']>
  'connection:error'?: EventHandler<ConnectionEvent['data']>
  
  // Chat handlers
  'chat:message:sent'?: EventHandler<ChatMessage>
  'chat:message:received'?: EventHandler<ChatMessage>
  'chat:typing'?: EventHandler<ChatTypingEvent['data']>
  'chat:stop-typing'?: EventHandler<ChatTypingEvent['data']>
  
  // Notification handlers
  'notification:new'?: EventHandler<Notification>
  'notification:read'?: EventHandler<Notification>
  'notification:cleared'?: EventHandler<{ notificationId: NotificationId }>
  
  // Document handlers
  'document:uploaded'?: EventHandler<DocumentEvent['data']>
  'document:updated'?: EventHandler<DocumentEvent['data']>
  'document:shared'?: EventHandler<DocumentEvent['data']>
  'document:reviewed'?: EventHandler<DocumentEvent['data']>
  
  // Planning handlers
  'planning:updated'?: EventHandler<PlanningEvent['data']>
  'planning:task:added'?: EventHandler<PlanningEvent['data']>
  'planning:task:completed'?: EventHandler<PlanningEvent['data']>
  
  // Presence handlers
  'presence:user:online'?: EventHandler<PresenceEvent['data']>
  'presence:user:offline'?: EventHandler<PresenceEvent['data']>
  'presence:user:typing'?: EventHandler<PresenceEvent['data']>
  
  // Booking handlers
  'booking:created'?: EventHandler<BookingEvent['data']>
  'booking:updated'?: EventHandler<BookingEvent['data']>
  'booking:confirmed'?: EventHandler<BookingEvent['data']>
  'booking:cancelled'?: EventHandler<BookingEvent['data']>
  
  // System handlers
  'system:maintenance'?: EventHandler<SystemEvent['data']>
  'system:announcement'?: EventHandler<SystemEvent['data']>
}

// API response types
export interface RealtimeResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// Channel subscription options
export interface SubscriptionOptions {
  presence?: boolean
  history?: number // Number of historical messages to fetch
  filter?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

// Rate limiting
export interface RateLimit {
  limit: number
  remaining: number
  resetTime: string
}

// Analytics and metrics
export interface RealtimeMetrics {
  connections: {
    total: number
    active: number
    byRole: Record<UserRole, number>
  }
  messages: {
    sent: number
    received: number
    failed: number
  }
  presence: {
    online: number
    typing: number
  }
  latency: {
    average: number
    p95: number
    p99: number
  }
  errors: {
    connection: number
    message: number
    subscription: number
  }
}

// Error types
export interface RealtimeError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
  recoverable: boolean
}

// Client configuration
export interface ClientConfig {
  userId: UserId
  userName: string
  userRole: UserRole
  sessionId?: string
  autoReconnect?: boolean
  enablePresence?: boolean
  enableTyping?: boolean
  messageHistory?: number
}

// Utility types
export type EventName = keyof EventHandlers
export type Unsubscribe = () => void
export type ChannelName = string