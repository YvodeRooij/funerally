/**
 * REAL-TIME PRESENCE SYSTEM - USER TRACKING & STATUS
 * 
 * Purpose: Comprehensive presence tracking for user activity and status
 * Features: Online/offline status, typing indicators, activity tracking, location awareness
 * Architecture: Event-driven system with automatic cleanup and heartbeat monitoring
 */

'use client'

import { 
  UserPresence, 
  UserId, 
  UserRole, 
  ChatId,
  RealtimeEvent 
} from './types'
import { CHANNELS, EVENTS, FEATURE_FLAGS } from './config'
import { RealtimeClient } from './client'

export interface PresenceActivity {
  userId: UserId
  action: 'page_view' | 'typing' | 'idle' | 'active' | 'focus' | 'blur'
  location: string // URL or page identifier
  timestamp: string
  metadata?: Record<string, any>
}

export interface PresenceSession {
  sessionId: string
  userId: UserId
  startTime: string
  lastActivity: string
  device: {
    type: 'desktop' | 'mobile' | 'tablet'
    browser: string
    os: string
  }
  location: {
    page: string
    url: string
  }
  isActive: boolean
}

export interface PresenceSettings {
  showOnlineStatus: boolean
  showTypingIndicators: boolean
  showLastSeen: boolean
  invisibleMode: boolean
  idleTimeout: number // minutes
  offlineTimeout: number // minutes
}

export interface PresenceState {
  users: Map<UserId, UserPresence>
  sessions: Map<string, PresenceSession>
  activities: PresenceActivity[]
  typing: Map<ChatId, Set<UserId>>
  currentUser?: UserPresence
}

export class PresenceManager {
  private client: RealtimeClient
  private state: PresenceState
  private settings: PresenceSettings
  private heartbeatInterval?: NodeJS.Timeout
  private idleTimer?: NodeJS.Timeout
  private activityTimer?: NodeJS.Timeout
  private lastActivity = Date.now()
  private currentPage = ''
  private isVisible = true
  private listeners = new Set<(state: PresenceState) => void>()

  constructor(client: RealtimeClient) {
    this.client = client
    this.state = {
      users: new Map(),
      sessions: new Map(),
      activities: [],
      typing: new Map(),
    }
    
    this.settings = this.getDefaultSettings()
    this.setupEventHandlers()
    this.setupActivityTracking()
    this.startHeartbeat()
  }

  private getDefaultSettings(): PresenceSettings {
    return {
      showOnlineStatus: true,
      showTypingIndicators: true,
      showLastSeen: true,
      invisibleMode: false,
      idleTimeout: 5, // 5 minutes
      offlineTimeout: 2, // 2 minutes after last heartbeat
    }
  }

  private setupEventHandlers(): void {
    // Handle presence events from other users
    this.client.on('presence:user:online', this.handleUserOnline.bind(this))
    this.client.on('presence:user:offline', this.handleUserOffline.bind(this))
    this.client.on('presence:user:typing', this.handleUserTyping.bind(this))
    
    // Handle connection events
    this.client.on('connection:opened', this.handleConnectionOpened.bind(this))
    this.client.on('connection:closed', this.handleConnectionClosed.bind(this))
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return

    // Track page changes
    this.trackPageChange()

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), { passive: true })
    })

    // Track page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // Track window focus/blur
    window.addEventListener('focus', () => this.handleFocusChange(true))
    window.addEventListener('blur', () => this.handleFocusChange(false))

    // Set up idle detection
    this.resetIdleTimer()
  }

  private trackPageChange(): void {
    const currentPage = window.location.pathname
    if (currentPage !== this.currentPage) {
      this.currentPage = currentPage
      this.trackActivity('page_view', currentPage)
    }
  }

  private handleActivity(): void {
    this.lastActivity = Date.now()
    this.resetIdleTimer()
    
    // Throttle activity updates
    if (this.activityTimer) return
    
    this.activityTimer = setTimeout(() => {
      this.trackActivity('active')
      this.activityTimer = undefined
    }, 1000)
  }

  private handleVisibilityChange(): void {
    this.isVisible = !document.hidden
    this.trackActivity(this.isVisible ? 'focus' : 'blur')
    
    if (this.isVisible) {
      this.setStatus('online')
    } else {
      this.setStatus('away')
    }
  }

  private handleFocusChange(focused: boolean): void {
    this.trackActivity(focused ? 'focus' : 'blur')
    
    if (focused && this.isVisible) {
      this.setStatus('online')
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    
    this.idleTimer = setTimeout(() => {
      this.setStatus('away')
      this.trackActivity('idle')
    }, this.settings.idleTimeout * 60 * 1000)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // Send heartbeat every 30 seconds
  }

  private async sendHeartbeat(): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_PRESENCE) return

    const currentUser = this.state.currentUser
    if (!currentUser) return

    try {
      await this.client.updatePresence({
        ...currentUser,
        lastSeen: new Date().toISOString(),
        currentPage: this.currentPage,
      })
    } catch (error) {
      console.error('[PresenceManager] Failed to send heartbeat:', error)
    }
  }

  // Public methods
  async initialize(userId: UserId, userName: string, userRole: UserRole): Promise<void> {
    const presence: UserPresence = {
      userId,
      userName,
      userRole,
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentPage: this.currentPage,
      isTyping: false,
      typingIn: [],
    }

    this.state.currentUser = presence
    this.state.users.set(userId, presence)

    // Create session
    const session: PresenceSession = {
      sessionId: this.generateSessionId(),
      userId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      device: this.getDeviceInfo(),
      location: {
        page: this.currentPage,
        url: window.location.href,
      },
      isActive: true,
    }

    this.state.sessions.set(session.sessionId, session)

    // Announce presence
    await this.announcePresence(presence)
    
    // Subscribe to presence channel
    this.subscribeToPresence()

    this.notifyStateChange()
  }

  private subscribeToPresence(): void {
    if (!this.state.currentUser) return

    const channel = CHANNELS.USER_PRESENCE(this.state.currentUser.userId)
    this.client.subscribe(channel, [
      EVENTS.USER_ONLINE,
      EVENTS.USER_OFFLINE,
      EVENTS.USER_TYPING,
    ])
  }

  async setStatus(status: UserPresence['status']): Promise<void> {
    if (!this.state.currentUser || this.settings.invisibleMode) return

    const previousStatus = this.state.currentUser.status
    this.state.currentUser.status = status
    this.state.currentUser.lastSeen = new Date().toISOString()

    // Update in users map
    this.state.users.set(this.state.currentUser.userId, this.state.currentUser)

    // Only announce if status actually changed
    if (previousStatus !== status) {
      await this.announcePresence(this.state.currentUser)
    }

    this.notifyStateChange()
  }

  async startTyping(chatId: ChatId): Promise<void> {
    if (!this.state.currentUser || this.settings.invisibleMode || !this.settings.showTypingIndicators) {
      return
    }

    // Add to typing list
    if (!this.state.currentUser.typingIn?.includes(chatId)) {
      this.state.currentUser.typingIn = [...(this.state.currentUser.typingIn || []), chatId]
      this.state.currentUser.isTyping = true
    }

    // Update local typing state
    const typingUsers = this.state.typing.get(chatId) || new Set()
    typingUsers.add(this.state.currentUser.userId)
    this.state.typing.set(chatId, typingUsers)

    // Announce typing
    await this.announceTyping(chatId, true)
    
    this.notifyStateChange()
  }

  async stopTyping(chatId: ChatId): Promise<void> {
    if (!this.state.currentUser) return

    // Remove from typing list
    if (this.state.currentUser.typingIn?.includes(chatId)) {
      this.state.currentUser.typingIn = this.state.currentUser.typingIn.filter(id => id !== chatId)
      this.state.currentUser.isTyping = (this.state.currentUser.typingIn?.length || 0) > 0
    }

    // Update local typing state
    const typingUsers = this.state.typing.get(chatId)
    if (typingUsers) {
      typingUsers.delete(this.state.currentUser.userId)
      if (typingUsers.size === 0) {
        this.state.typing.delete(chatId)
      }
    }

    // Announce stop typing
    await this.announceTyping(chatId, false)
    
    this.notifyStateChange()
  }

  private async announcePresence(presence: UserPresence): Promise<void> {
    try {
      const channel = CHANNELS.USER_PRESENCE(presence.userId)
      await this.client.updatePresence(presence)
    } catch (error) {
      console.error('[PresenceManager] Failed to announce presence:', error)
    }
  }

  private async announceTyping(chatId: ChatId, isTyping: boolean): Promise<void> {
    if (!this.state.currentUser) return

    try {
      const channel = CHANNELS.CHAT_PRESENCE(chatId)
      const event = isTyping ? EVENTS.MESSAGE_TYPING : EVENTS.MESSAGE_STOP_TYPING
      
      // Use the client's typing methods
      if (isTyping) {
        await this.client.startTyping(chatId)
      } else {
        await this.client.stopTyping(chatId)
      }
    } catch (error) {
      console.error('[PresenceManager] Failed to announce typing:', error)
    }
  }

  private trackActivity(action: PresenceActivity['action'], location?: string): void {
    if (!this.state.currentUser) return

    const activity: PresenceActivity = {
      userId: this.state.currentUser.userId,
      action,
      location: location || this.currentPage,
      timestamp: new Date().toISOString(),
    }

    // Add to activities (keep last 100)
    this.state.activities.unshift(activity)
    if (this.state.activities.length > 100) {
      this.state.activities = this.state.activities.slice(0, 100)
    }

    // Update current user's page if it's a page view
    if (action === 'page_view' && location) {
      this.state.currentUser.currentPage = location
    }

    // Send activity update
    this.sendActivityUpdate(activity)
  }

  private async sendActivityUpdate(activity: PresenceActivity): Promise<void> {
    try {
      await fetch('/api/realtime/presence/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(activity),
      })
    } catch (error) {
      console.error('[PresenceManager] Failed to send activity update:', error)
    }
  }

  // Event handlers
  private handleUserOnline(event: RealtimeEvent<any>): void {
    const { userId, presence } = event.data
    this.state.users.set(userId, presence)
    this.notifyStateChange()
  }

  private handleUserOffline(event: RealtimeEvent<any>): void {
    const { userId } = event.data
    const user = this.state.users.get(userId)
    if (user) {
      user.status = 'offline'
      user.lastSeen = event.timestamp
      this.state.users.set(userId, user)
    }
    this.notifyStateChange()
  }

  private handleUserTyping(event: RealtimeEvent<any>): void {
    const { chatId, userId, isTyping } = event.data
    
    const typingUsers = this.state.typing.get(chatId) || new Set()
    
    if (isTyping) {
      typingUsers.add(userId)
    } else {
      typingUsers.delete(userId)
    }
    
    if (typingUsers.size > 0) {
      this.state.typing.set(chatId, typingUsers)
    } else {
      this.state.typing.delete(chatId)
    }
    
    this.notifyStateChange()
  }

  private handleConnectionOpened(): void {
    if (this.state.currentUser) {
      this.setStatus('online')
    }
  }

  private handleConnectionClosed(): void {
    if (this.state.currentUser) {
      this.state.currentUser.status = 'offline'
      this.notifyStateChange()
    }
  }

  // Getters
  getPresence(userId: UserId): UserPresence | undefined {
    return this.state.users.get(userId)
  }

  isUserOnline(userId: UserId): boolean {
    const presence = this.state.users.get(userId)
    return presence?.status === 'online'
  }

  isUserTyping(userId: UserId, chatId?: ChatId): boolean {
    if (chatId) {
      const typingUsers = this.state.typing.get(chatId)
      return typingUsers?.has(userId) || false
    }
    
    const presence = this.state.users.get(userId)
    return presence?.isTyping || false
  }

  getTypingUsers(chatId: ChatId): UserId[] {
    const typingUsers = this.state.typing.get(chatId)
    return typingUsers ? Array.from(typingUsers) : []
  }

  getOnlineUsers(): UserPresence[] {
    return Array.from(this.state.users.values()).filter(user => user.status === 'online')
  }

  getUsersInChat(chatId: ChatId): UserPresence[] {
    // This would need integration with chat system to get chat participants
    return this.getOnlineUsers()
  }

  getState(): PresenceState {
    return { ...this.state }
  }

  // Settings
  updateSettings(settings: Partial<PresenceSettings>): void {
    this.settings = { ...this.settings, ...settings }
    
    // Apply settings changes
    if (settings.invisibleMode !== undefined) {
      if (settings.invisibleMode) {
        this.setStatus('offline')
      } else {
        this.setStatus('online')
      }
    }
    
    if (settings.idleTimeout !== undefined) {
      this.resetIdleTimer()
    }
  }

  getSettings(): PresenceSettings {
    return { ...this.settings }
  }

  // Activity tracking
  getRecentActivity(limit = 20): PresenceActivity[] {
    return this.state.activities.slice(0, limit)
  }

  getUserActivity(userId: UserId, limit = 10): PresenceActivity[] {
    return this.state.activities
      .filter(activity => activity.userId === userId)
      .slice(0, limit)
  }

  // State management
  subscribe(listener: (state: PresenceState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyStateChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[PresenceManager] Listener error:', error)
      }
    })
  }

  // Utility methods
  private getDeviceInfo(): PresenceSession['device'] {
    if (typeof window === 'undefined') {
      return { type: 'desktop', browser: 'unknown', os: 'unknown' }
    }

    const userAgent = navigator.userAgent
    
    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (/Mobi|Android/i.test(userAgent)) {
      deviceType = 'mobile'
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'tablet'
    }

    // Detect browser
    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    // Detect OS
    let os = 'unknown'
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return { type: deviceType, browser, os }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getAuthToken(): Promise<string> {
    return 'auth-token'
  }

  // Cleanup
  destroy(): void {
    // Clear timers
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
      window.removeEventListener('focus', () => this.handleFocusChange(true))
      window.removeEventListener('blur', () => this.handleFocusChange(false))
    }

    // Set offline status
    if (this.state.currentUser) {
      this.setStatus('offline')
    }

    // Clear state
    this.state.users.clear()
    this.state.sessions.clear()
    this.state.activities = []
    this.state.typing.clear()
    this.listeners.clear()
  }
}

// Factory function
export const createPresenceManager = (client: RealtimeClient): PresenceManager => {
  return new PresenceManager(client)
}