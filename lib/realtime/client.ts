/**
 * REAL-TIME CLIENT - CONNECTION MANAGER
 * 
 * Purpose: Unified real-time communication client with automatic reconnection
 * Features: WebSocket/Pusher abstraction, event handling, presence tracking
 * Architecture: Provider-agnostic design supporting multiple real-time services
 */

'use client'

import { EventEmitter } from 'events'
import { 
  ConnectionStatus, 
  RealtimeEvent, 
  EventHandlers, 
  ClientConfig, 
  RealtimeState, 
  RealtimeError,
  UserId,
  ChatId,
  ChannelName,
  Unsubscribe,
  EventName,
  UserPresence,
  ChatMessage,
  Notification,
  RateLimit
} from './types'
import { 
  DEFAULT_REALTIME_CONFIG, 
  PUSHER_CONFIG, 
  WEBSOCKET_CONFIG,
  CHANNELS,
  EVENTS,
  RATE_LIMITS,
  FEATURE_FLAGS
} from './config'

// Pusher client types (will be loaded dynamically)
interface PusherClient {
  connect(): void
  disconnect(): void
  subscribe(channel: string): PusherChannel
  unsubscribe(channel: string): void
  bind(event: string, callback: Function): void
  unbind(event: string, callback?: Function): void
  connection: {
    state: string
    bind(event: string, callback: Function): void
    unbind(event: string, callback?: Function): void
  }
}

interface PusherChannel {
  bind(event: string, callback: Function): void
  unbind(event: string, callback?: Function): void
  trigger(event: string, data: any): void
}

export class RealtimeClient extends EventEmitter {
  private config: ClientConfig
  private connectionStatus: ConnectionStatus = 'disconnected'
  private pusherClient?: PusherClient
  private websocket?: WebSocket
  private reconnectAttempts = 0
  private reconnectTimer?: NodeJS.Timeout
  private heartbeatTimer?: NodeJS.Timeout
  private subscriptions = new Map<ChannelName, Set<string>>()
  private eventHandlers = new Map<EventName, Set<Function>>()
  private rateLimits = new Map<string, RateLimit>()
  private messageQueue: RealtimeEvent[] = []
  private state: RealtimeState
  
  constructor(config: ClientConfig) {
    super()
    this.config = config
    this.state = this.initializeState()
    this.setupErrorHandling()
  }

  private initializeState(): RealtimeState {
    return {
      connection: {
        status: 'disconnected',
        reconnectAttempts: 0,
      },
      presence: {
        users: new Map(),
        typing: new Map(),
      },
      chats: {
        active: new Map(),
        unreadCounts: new Map(),
        typing: new Map(),
      },
      notifications: {
        items: [],
        unreadCount: 0,
      },
      planning: {
        active: new Map(),
        updates: [],
      },
      documents: {
        recent: [],
        shared: [],
        pending: [],
      },
    }
  }

  private setupErrorHandling(): void {
    this.on('error', (error: RealtimeError) => {
      console.error('[RealtimeClient] Error:', error)
      
      if (error.recoverable && this.config.autoReconnect !== false) {
        this.handleReconnect()
      }
    })
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return
    }

    this.setConnectionStatus('connecting')

    try {
      if (DEFAULT_REALTIME_CONFIG.provider === 'pusher') {
        await this.connectPusher()
      } else {
        await this.connectWebSocket()
      }
    } catch (error) {
      this.setConnectionStatus('error')
      throw new RealtimeError({
        code: 'CONNECTION_FAILED',
        message: 'Failed to establish connection',
        details: { error },
        timestamp: new Date().toISOString(),
        recoverable: true,
      })
    }
  }

  private async connectPusher(): Promise<void> {
    try {
      // Dynamically import Pusher to avoid SSR issues
      const Pusher = (await import('pusher-js')).default

      this.pusherClient = new Pusher(PUSHER_CONFIG.key, {
        cluster: PUSHER_CONFIG.cluster,
        useTLS: PUSHER_CONFIG.useTLS,
        enabledTransports: PUSHER_CONFIG.enabledTransports,
        disabledTransports: PUSHER_CONFIG.disabledTransports,
        authTransport: 'jsonp',
        auth: {
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
        },
      })

      this.pusherClient.connection.bind('connected', () => {
        this.setConnectionStatus('connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.processMessageQueue()
      })

      this.pusherClient.connection.bind('disconnected', () => {
        this.setConnectionStatus('disconnected')
        this.stopHeartbeat()
      })

      this.pusherClient.connection.bind('error', (error: any) => {
        this.emit('error', {
          code: 'PUSHER_ERROR',
          message: 'Pusher connection error',
          details: { error },
          timestamp: new Date().toISOString(),
          recoverable: true,
        })
      })

      this.pusherClient.connect()
    } catch (error) {
      throw new Error(`Failed to initialize Pusher: ${error}`)
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(WEBSOCKET_CONFIG.url, WEBSOCKET_CONFIG.protocols)

        this.websocket.onopen = () => {
          this.setConnectionStatus('connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          resolve()
        }

        this.websocket.onclose = (event) => {
          this.setConnectionStatus('disconnected')
          this.stopHeartbeat()
          
          if (event.code !== 1000 && this.config.autoReconnect !== false) {
            this.handleReconnect()
          }
        }

        this.websocket.onerror = (error) => {
          this.emit('error', {
            code: 'WEBSOCKET_ERROR',
            message: 'WebSocket connection error',
            details: { error },
            timestamp: new Date().toISOString(),
            recoverable: true,
          })
          reject(error)
        }

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event.data)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.setConnectionStatus('disconnected')
    this.stopHeartbeat()
    this.clearReconnectTimer()

    if (this.pusherClient) {
      this.pusherClient.disconnect()
      this.pusherClient = undefined
    }

    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect')
      this.websocket = undefined
    }

    this.subscriptions.clear()
    this.eventHandlers.clear()
  }

  // Event handling
  on<T extends EventName>(event: T, handler: EventHandlers[T]): Unsubscribe {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    const handlers = this.eventHandlers.get(event)!
    handlers.add(handler as Function)

    // Auto-subscribe to relevant channels based on event type
    this.autoSubscribeForEvent(event)

    return () => {
      handlers.delete(handler as Function)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  off<T extends EventName>(event: T, handler?: EventHandlers[T]): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers) return

    if (handler) {
      handlers.delete(handler as Function)
    } else {
      handlers.clear()
    }

    if (handlers.size === 0) {
      this.eventHandlers.delete(event)
    }
  }

  private emit<T>(event: EventName, data: T): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers) return

    const realtimeEvent: RealtimeEvent<T> = {
      type: event,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      data,
    }

    handlers.forEach(handler => {
      try {
        handler(realtimeEvent)
      } catch (error) {
        console.error(`[RealtimeClient] Handler error for ${event}:`, error)
      }
    })

    // Also emit to EventEmitter for internal use
    super.emit(event, realtimeEvent)
  }

  // Channel management
  subscribe(channel: ChannelName, events: string[] = []): Unsubscribe {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }

    const channelEvents = this.subscriptions.get(channel)!
    events.forEach(event => channelEvents.add(event))

    if (this.connectionStatus === 'connected') {
      this.performSubscription(channel, events)
    }

    return () => this.unsubscribe(channel, events)
  }

  private unsubscribe(channel: ChannelName, events: string[] = []): void {
    const channelEvents = this.subscriptions.get(channel)
    if (!channelEvents) return

    if (events.length === 0) {
      // Unsubscribe from all events in channel
      this.subscriptions.delete(channel)
      this.performUnsubscription(channel)
    } else {
      // Unsubscribe from specific events
      events.forEach(event => channelEvents.delete(event))
      if (channelEvents.size === 0) {
        this.subscriptions.delete(channel)
        this.performUnsubscription(channel)
      }
    }
  }

  private performSubscription(channel: ChannelName, events: string[]): void {
    if (this.pusherClient) {
      const pusherChannel = this.pusherClient.subscribe(channel)
      events.forEach(event => {
        pusherChannel.bind(event, (data: any) => {
          this.handleChannelEvent(channel, event, data)
        })
      })
    } else if (this.websocket) {
      this.sendWebSocketMessage({
        type: 'subscribe',
        channel,
        events,
      })
    }
  }

  private performUnsubscription(channel: ChannelName): void {
    if (this.pusherClient) {
      this.pusherClient.unsubscribe(channel)
    } else if (this.websocket) {
      this.sendWebSocketMessage({
        type: 'unsubscribe',
        channel,
      })
    }
  }

  // Message handling
  async sendMessage(chatId: ChatId, content: string, type: 'text' | 'image' | 'document' = 'text'): Promise<void> {
    if (!this.checkRateLimit('messages')) {
      throw new RealtimeError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Message rate limit exceeded',
        timestamp: new Date().toISOString(),
        recoverable: false,
      })
    }

    const message: Partial<ChatMessage> = {
      chatId,
      senderId: this.config.userId,
      senderName: this.config.userName,
      senderRole: this.config.userRole,
      content,
      type,
      timestamp: new Date().toISOString(),
      status: 'sending',
    }

    try {
      await this.sendToChannel(CHANNELS.FAMILY_DIRECTOR_CHAT(chatId, ''), EVENTS.MESSAGE_SENT, message)
      
      // Update local state
      const chatMessages = this.state.chats.active.get(chatId) || []
      chatMessages.push(message as ChatMessage)
      this.state.chats.active.set(chatId, chatMessages)
      
    } catch (error) {
      message.status = 'failed'
      throw error
    }
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<void> {
    if (!this.checkRateLimit('notifications')) {
      throw new RealtimeError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Notification rate limit exceeded',
        timestamp: new Date().toISOString(),
        recoverable: false,
      })
    }

    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    }

    await this.sendToChannel(
      CHANNELS.FAMILY_NOTIFICATIONS(notification.userId), 
      EVENTS.NOTIFICATION_NEW, 
      fullNotification
    )
  }

  // Presence management
  async updatePresence(presence: Partial<UserPresence>): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_PRESENCE) return

    const fullPresence: UserPresence = {
      userId: this.config.userId,
      userName: this.config.userName,
      userRole: this.config.userRole,
      status: 'online',
      lastSeen: new Date().toISOString(),
      ...presence,
    }

    this.state.presence.currentUser = fullPresence

    await this.sendToChannel(
      CHANNELS.USER_PRESENCE(this.config.userId),
      EVENTS.USER_ONLINE,
      fullPresence
    )
  }

  // Typing indicators
  async startTyping(chatId: ChatId): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_PRESENCE) return
    if (!this.checkRateLimit('typing')) return

    await this.sendToChannel(
      CHANNELS.CHAT_PRESENCE(chatId),
      EVENTS.MESSAGE_TYPING,
      {
        chatId,
        userId: this.config.userId,
        userName: this.config.userName,
        isTyping: true,
      }
    )
  }

  async stopTyping(chatId: ChatId): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_PRESENCE) return

    await this.sendToChannel(
      CHANNELS.CHAT_PRESENCE(chatId),
      EVENTS.MESSAGE_STOP_TYPING,
      {
        chatId,
        userId: this.config.userId,
        userName: this.config.userName,
        isTyping: false,
      }
    )
  }

  // State access
  getState(): RealtimeState {
    return { ...this.state }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  // Private methods
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.state.connection.status = status
      
      this.emit('connection:status', {
        status,
        timestamp: new Date().toISOString(),
      })
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= DEFAULT_REALTIME_CONFIG.maxReconnectAttempts) {
      this.setConnectionStatus('error')
      return
    }

    this.reconnectAttempts++
    this.setConnectionStatus('reconnecting')

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[RealtimeClient] Reconnect failed:', error)
      })
    }, DEFAULT_REALTIME_CONFIG.reconnectInterval)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.sendHeartbeat()
      }
    }, DEFAULT_REALTIME_CONFIG.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      await this.sendToChannel('heartbeat', 'ping', { timestamp: Date.now() })
    } catch (error) {
      console.warn('[RealtimeClient] Heartbeat failed:', error)
    }
  }

  private async sendToChannel(channel: ChannelName, event: string, data: any): Promise<void> {
    const message = {
      channel,
      event,
      data,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
    }

    if (this.connectionStatus !== 'connected') {
      this.messageQueue.push(message)
      return
    }

    if (this.pusherClient) {
      // For Pusher, use HTTP API for sending messages
      await this.sendViaPusherAPI(channel, event, data)
    } else if (this.websocket) {
      this.sendWebSocketMessage(message)
    }
  }

  private sendWebSocketMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    }
  }

  private async sendViaPusherAPI(channel: ChannelName, event: string, data: any): Promise<void> {
    try {
      const response = await fetch('/api/realtime/pusher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          channel,
          event,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[RealtimeClient] Failed to send via Pusher API:', error)
      throw error
    }
  }

  private processMessageQueue(): void {
    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach(message => {
      this.sendToChannel(message.channel, message.event, message.data).catch(error => {
        console.error('[RealtimeClient] Failed to send queued message:', error)
      })
    })
  }

  private handleChannelEvent(channel: ChannelName, event: string, data: any): void {
    // Update local state based on event
    this.updateStateFromEvent(event, data)

    // Emit to registered handlers
    this.emit(event as EventName, data)
  }

  private handleWebSocketMessage(message: string): void {
    try {
      const parsed = JSON.parse(message)
      this.handleChannelEvent(parsed.channel, parsed.event, parsed.data)
    } catch (error) {
      console.error('[RealtimeClient] Failed to parse WebSocket message:', error)
    }
  }

  private updateStateFromEvent(event: string, data: any): void {
    switch (event) {
      case EVENTS.MESSAGE_RECEIVED:
        this.updateChatState(data)
        break
      case EVENTS.NOTIFICATION_NEW:
        this.updateNotificationState(data)
        break
      case EVENTS.USER_ONLINE:
      case EVENTS.USER_OFFLINE:
        this.updatePresenceState(data)
        break
      // Add more event handlers as needed
    }
  }

  private updateChatState(message: ChatMessage): void {
    const messages = this.state.chats.active.get(message.chatId) || []
    messages.push(message)
    this.state.chats.active.set(message.chatId, messages)

    // Update unread count if message is not from current user
    if (message.senderId !== this.config.userId) {
      const currentCount = this.state.chats.unreadCounts.get(message.chatId) || 0
      this.state.chats.unreadCounts.set(message.chatId, currentCount + 1)
    }
  }

  private updateNotificationState(notification: Notification): void {
    this.state.notifications.items.unshift(notification)
    if (!notification.read) {
      this.state.notifications.unreadCount++
    }
  }

  private updatePresenceState(presence: UserPresence): void {
    this.state.presence.users.set(presence.userId, presence)
  }

  private autoSubscribeForEvent(event: EventName): void {
    // Auto-subscribe to relevant channels based on event type
    switch (event) {
      case 'chat:message:received':
      case 'chat:typing':
        // Will be handled when specific chat channels are subscribed
        break
      case 'notification:new':
        this.subscribe(CHANNELS.FAMILY_NOTIFICATIONS(this.config.userId))
        break
      case 'presence:user:online':
      case 'presence:user:offline':
        this.subscribe(CHANNELS.USER_PRESENCE(this.config.userId))
        break
    }
  }

  private checkRateLimit(type: 'messages' | 'notifications' | 'typing'): boolean {
    const limit = RATE_LIMITS[`${type.toUpperCase()}_PER_MINUTE` as keyof typeof RATE_LIMITS]
    const key = `${type}_${Math.floor(Date.now() / 60000)}`
    
    const current = this.rateLimits.get(key) || {
      limit,
      remaining: limit,
      resetTime: new Date(Math.ceil(Date.now() / 60000) * 60000).toISOString(),
    }

    if (current.remaining <= 0) {
      return false
    }

    current.remaining--
    this.rateLimits.set(key, current)
    return true
  }

  private async getAuthToken(): Promise<string> {
    // This would integrate with your auth system
    // For now, return a placeholder
    return 'user-auth-token'
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
let realtimeClient: RealtimeClient | null = null

export const createRealtimeClient = (config: ClientConfig): RealtimeClient => {
  if (realtimeClient) {
    realtimeClient.disconnect()
  }
  
  realtimeClient = new RealtimeClient(config)
  return realtimeClient
}

export const getRealtimeClient = (): RealtimeClient | null => {
  return realtimeClient
}

// Error class
class RealtimeError extends Error {
  public code: string
  public details?: Record<string, unknown>
  public timestamp: string
  public recoverable: boolean

  constructor(params: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
    recoverable: boolean
  }) {
    super(params.message)
    this.name = 'RealtimeError'
    this.code = params.code
    this.details = params.details
    this.timestamp = params.timestamp
    this.recoverable = params.recoverable
  }
}