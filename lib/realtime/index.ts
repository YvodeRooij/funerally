/**
 * REAL-TIME COMMUNICATION SYSTEM - MAIN ENTRY POINT
 * 
 * Purpose: Unified export and initialization for all real-time features
 * Features: Centralized management, factory functions, React integration
 * Architecture: Modular system with lazy loading and optimized performance
 */

'use client'

// Core exports
export * from './types'
export * from './config'
export * from './client'
export * from './hooks'

// Feature exports
export * from './chat'
export * from './notifications'
export * from './presence'
export * from './collaborative-planning'
export * from './document-sharing'

// Main factory and manager classes
export {
  RealtimeClient,
  createRealtimeClient,
  getRealtimeClient,
} from './client'

export {
  ChatManager,
  createChatManager,
} from './chat'

export {
  NotificationManager,
  createNotificationManager,
} from './notifications'

export {
  PresenceManager,
  createPresenceManager,
} from './presence'

export {
  CollaborativePlanningManager,
  createCollaborativePlanningManager,
} from './collaborative-planning'

export {
  DocumentSharingManager,
  createDocumentSharingManager,
} from './document-sharing'

// Hooks exports
export {
  useRealtimeClient,
  useChat,
  useChatRoom,
  useTypingIndicator,
  usePresence,
  useNotifications,
  useConnectionStatus,
  useAutoScroll,
  useFileUpload,
} from './hooks'

// Types re-exports for convenience
export type {
  ClientConfig,
  RealtimeState,
  ConnectionStatus,
  ChatMessage,
  ChatRoom,
  UserPresence,
  Notification,
  Planning,
  DocumentInfo,
  UserId,
  ChatId,
  FamilyId,
  DirectorId,
  VenueId,
} from './types'

import { 
  RealtimeClient, 
  createRealtimeClient 
} from './client'
import { 
  ChatManager, 
  createChatManager 
} from './chat'
import { 
  NotificationManager, 
  createNotificationManager 
} from './notifications'
import { 
  PresenceManager, 
  createPresenceManager 
} from './presence'
import { 
  CollaborativePlanningManager, 
  createCollaborativePlanningManager 
} from './collaborative-planning'
import { 
  DocumentSharingManager, 
  createDocumentSharingManager 
} from './document-sharing'
import { 
  ClientConfig, 
  UserId, 
  UserRole 
} from './types'
import { FEATURE_FLAGS } from './config'

/**
 * Comprehensive Real-time Manager
 * Coordinates all real-time features and provides unified interface
 */
export class FarewellyRealtimeManager {
  private client: RealtimeClient
  private chatManager?: ChatManager
  private notificationManager?: NotificationManager
  private presenceManager?: PresenceManager
  private planningManager?: CollaborativePlanningManager
  private documentManager?: DocumentSharingManager
  private initialized = false

  constructor(config: ClientConfig) {
    this.client = createRealtimeClient(config)
  }

  /**
   * Initialize all enabled real-time features
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Connect the client first
      await this.client.connect()

      // Initialize managers based on feature flags
      if (FEATURE_FLAGS.ENABLE_CHAT) {
        this.chatManager = createChatManager(this.client)
      }

      if (FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
        this.notificationManager = createNotificationManager(this.client)
      }

      if (FEATURE_FLAGS.ENABLE_PRESENCE) {
        this.presenceManager = createPresenceManager(this.client)
        
        // Initialize presence for current user
        const state = this.client.getState()
        if (state.presence.currentUser) {
          await this.presenceManager.initialize(
            state.presence.currentUser.userId,
            state.presence.currentUser.userName,
            state.presence.currentUser.userRole
          )
        }
      }

      if (FEATURE_FLAGS.ENABLE_COLLABORATIVE_EDITING) {
        this.planningManager = createCollaborativePlanningManager(this.client)
      }

      if (FEATURE_FLAGS.ENABLE_DOCUMENT_SHARING) {
        this.documentManager = createDocumentSharingManager(this.client)
      }

      this.initialized = true
    } catch (error) {
      console.error('[FarewellyRealtimeManager] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Get the real-time client
   */
  getClient(): RealtimeClient {
    return this.client
  }

  /**
   * Get the chat manager
   */
  getChat(): ChatManager | undefined {
    return this.chatManager
  }

  /**
   * Get the notification manager
   */
  getNotifications(): NotificationManager | undefined {
    return this.notificationManager
  }

  /**
   * Get the presence manager
   */
  getPresence(): PresenceManager | undefined {
    return this.presenceManager
  }

  /**
   * Get the planning manager
   */
  getPlanning(): CollaborativePlanningManager | undefined {
    return this.planningManager
  }

  /**
   * Get the document manager
   */
  getDocuments(): DocumentSharingManager | undefined {
    return this.documentManager
  }

  /**
   * Check if a feature is enabled and initialized
   */
  isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
    return FEATURE_FLAGS[feature] && this.initialized
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.client.getConnectionStatus()
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      connected: this.client.getConnectionStatus() === 'connected',
      initialized: this.initialized,
      features: {
        chat: !!this.chatManager,
        notifications: !!this.notificationManager,
        presence: !!this.presenceManager,
        planning: !!this.planningManager,
        documents: !!this.documentManager,
      },
      state: this.client.getState(),
    }
  }

  /**
   * Cleanup and disconnect
   */
  async destroy(): Promise<void> {
    // Destroy all managers
    this.documentManager?.destroy()
    this.planningManager?.destroy()
    this.presenceManager?.destroy()
    this.notificationManager?.destroy()
    this.chatManager?.destroy()

    // Disconnect client
    this.client.disconnect()

    this.initialized = false
  }
}

/**
 * Global instance management
 */
let globalRealtimeManager: FarewellyRealtimeManager | null = null

/**
 * Create or get the global realtime manager instance
 */
export const createFarewellyRealtime = (config: ClientConfig): FarewellyRealtimeManager => {
  if (globalRealtimeManager) {
    globalRealtimeManager.destroy()
  }
  
  globalRealtimeManager = new FarewellyRealtimeManager(config)
  return globalRealtimeManager
}

/**
 * Get the current global realtime manager instance
 */
export const getFarewellyRealtime = (): FarewellyRealtimeManager | null => {
  return globalRealtimeManager
}

/**
 * React Context Provider for real-time functionality
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface RealtimeContextValue {
  manager: FarewellyRealtimeManager | null
  initialized: boolean
  connected: boolean
  error: string | null
}

const RealtimeContext = createContext<RealtimeContextValue>({
  manager: null,
  initialized: false,
  connected: false,
  error: null,
})

export interface RealtimeProviderProps {
  children: ReactNode
  config: ClientConfig
  autoConnect?: boolean
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  config,
  autoConnect = true,
}) => {
  const [manager, setManager] = useState<FarewellyRealtimeManager | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const realtimeManager = createFarewellyRealtime(config)
    setManager(realtimeManager)

    if (autoConnect) {
      realtimeManager.initialize()
        .then(() => {
          setInitialized(true)
          setConnected(true)
          setError(null)
        })
        .catch((err) => {
          setError(err.message)
          setInitialized(false)
          setConnected(false)
        })
    }

    // Listen for connection status changes
    const client = realtimeManager.getClient()
    const handleStatusChange = (event: any) => {
      setConnected(event.data.status === 'connected')
    }

    client.on('connection:status', handleStatusChange)

    return () => {
      client.off('connection:status', handleStatusChange)
      realtimeManager.destroy()
    }
  }, [config, autoConnect])

  const value: RealtimeContextValue = {
    manager,
    initialized,
    connected,
    error,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

/**
 * Hook to use the realtime context
 */
export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

/**
 * Utility functions for common operations
 */
export const RealtimeUtils = {
  /**
   * Create a family-director chat
   */
  async createFamilyDirectorChat(
    familyId: string,
    directorId: string,
    caseId?: string
  ) {
    const manager = getFarewellyRealtime()
    const chat = manager?.getChat()
    
    if (!chat) throw new Error('Chat not available')

    return await chat.createChat([familyId, directorId], {
      familyId,
      directorId,
      caseId,
      subject: 'Family-Director Communication',
    })
  },

  /**
   * Send urgent notification
   */
  async sendUrgentNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ) {
    const manager = getFarewellyRealtime()
    const notifications = manager?.getNotifications()
    
    if (!notifications) throw new Error('Notifications not available')

    return await notifications.createNotification(
      'urgent_notification',
      [userId],
      { title, message },
      {
        priority: 'urgent',
        metadata: { actionUrl },
      }
    )
  },

  /**
   * Create planning session
   */
  async createPlanningSession(
    familyId: string,
    directorId: string,
    title: string,
    description?: string
  ) {
    const manager = getFarewellyRealtime()
    const planning = manager?.getPlanning()
    
    if (!planning) throw new Error('Planning not available')

    return await planning.createPlanning(familyId, directorId, title, description)
  },

  /**
   * Share document with family
   */
  async shareDocumentWithFamily(
    documentId: string,
    familyMembers: string[],
    permissions: {
      view?: boolean
      comment?: boolean
      download?: boolean
    } = { view: true, comment: true }
  ) {
    const manager = getFarewellyRealtime()
    const documents = manager?.getDocuments()
    
    if (!documents) throw new Error('Document sharing not available')

    const recipients = familyMembers.map(userId => ({
      userId,
      permissions,
    }))

    return await documents.shareDocument(documentId, recipients)
  },

  /**
   * Get system health status
   */
  getSystemHealth() {
    const manager = getFarewellyRealtime()
    if (!manager) return { status: 'unavailable' }

    const status = manager.getSystemStatus()
    return {
      status: status.connected ? 'healthy' : 'disconnected',
      features: status.features,
      lastUpdate: new Date().toISOString(),
    }
  },
}

/**
 * Development helpers (only available in development)
 */
export const RealtimeDevTools = process.env.NODE_ENV === 'development' ? {
  /**
   * Get current manager instance for debugging
   */
  getManager: getFarewellyRealtime,

  /**
   * Force reconnection
   */
  async forceReconnect() {
    const manager = getFarewellyRealtime()
    if (manager) {
      const client = manager.getClient()
      client.disconnect()
      await client.connect()
    }
  },

  /**
   * Simulate network issues
   */
  simulateNetworkIssue(duration = 5000) {
    const manager = getFarewellyRealtime()
    if (manager) {
      const client = manager.getClient()
      client.disconnect()
      setTimeout(() => {
        client.connect().catch(console.error)
      }, duration)
    }
  },

  /**
   * Get detailed state for debugging
   */
  getDebugState() {
    const manager = getFarewellyRealtime()
    if (!manager) return null

    return {
      system: manager.getSystemStatus(),
      chat: manager.getChat()?.getState(),
      presence: manager.getPresence()?.getState(),
      planning: manager.getPlanning()?.getState(),
      documents: manager.getDocuments()?.getState(),
    }
  },
} : undefined

export default FarewellyRealtimeManager