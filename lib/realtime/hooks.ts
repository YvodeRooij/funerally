/**
 * REAL-TIME HOOKS - REACT INTEGRATION
 * 
 * Purpose: React hooks for seamless real-time communication integration
 * Features: Chat management, presence tracking, notifications, typing indicators
 * Architecture: Custom hooks with automatic state management and cleanup
 */

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { 
  RealtimeClient, 
  createRealtimeClient, 
  getRealtimeClient 
} from './client'
import { 
  ChatManager, 
  createChatManager,
  ChatState,
  ChatRoom,
  ChatParticipant 
} from './chat'
import { 
  ConnectionStatus, 
  ClientConfig, 
  ChatMessage, 
  ChatId, 
  UserId, 
  UserPresence,
  Notification,
  RealtimeState,
  MessageId,
  MessageAttachment
} from './types'

// Real-time client hook
export function useRealtimeClient(config: ClientConfig) {
  const [client, setClient] = useState<RealtimeClient | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const realtimeClient = createRealtimeClient(config)
    setClient(realtimeClient)

    // Handle connection status changes
    const handleConnectionStatus = (event: any) => {
      setConnectionStatus(event.data.status)
    }

    // Handle errors
    const handleError = (error: Error) => {
      setError(error.message)
    }

    realtimeClient.on('connection:status', handleConnectionStatus)
    realtimeClient.on('error', handleError)

    // Auto-connect
    realtimeClient.connect().catch((err) => {
      console.error('Failed to connect:', err)
      setError(err.message)
    })

    return () => {
      realtimeClient.off('connection:status', handleConnectionStatus)
      realtimeClient.off('error', handleError)
      realtimeClient.disconnect()
    }
  }, [config.userId, config.userName, config.userRole])

  const connect = useCallback(async () => {
    if (client) {
      setError(null)
      try {
        await client.connect()
      } catch (err: any) {
        setError(err.message)
      }
    }
  }, [client])

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
    }
  }, [client])

  return {
    client,
    connectionStatus,
    error,
    connect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
  }
}

// Chat management hook
export function useChat(client: RealtimeClient | null) {
  const [chatManager, setChatManager] = useState<ChatManager | null>(null)
  const [chatState, setChatState] = useState<ChatState>({
    rooms: new Map(),
    messages: new Map(),
    typing: new Map(),
    loading: new Map(),
  })

  useEffect(() => {
    if (!client) return

    const manager = createChatManager(client)
    setChatManager(manager)

    // Subscribe to state changes
    const unsubscribe = manager.subscribe(setChatState)

    return () => {
      unsubscribe()
      manager.destroy()
    }
  }, [client])

  const sendMessage = useCallback(async (
    chatId: ChatId, 
    content: string, 
    type: ChatMessage['type'] = 'text',
    attachments?: MessageAttachment[],
    replyTo?: MessageId
  ) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.sendMessage(chatId, content, type, attachments, replyTo)
  }, [chatManager])

  const joinChat = useCallback(async (chatId: ChatId) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.joinChat(chatId)
  }, [chatManager])

  const createChat = useCallback(async (participants: UserId[], metadata: ChatRoom['metadata']) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.createChat(participants, metadata)
  }, [chatManager])

  const startTyping = useCallback(async (chatId: ChatId) => {
    if (!chatManager) return
    return await chatManager.startTyping(chatId)
  }, [chatManager])

  const stopTyping = useCallback(async (chatId: ChatId) => {
    if (!chatManager) return
    return await chatManager.stopTyping(chatId)
  }, [chatManager])

  const markAsRead = useCallback(async (chatId: ChatId, messageId?: MessageId) => {
    if (!chatManager) return
    return await chatManager.markAsRead(chatId, messageId)
  }, [chatManager])

  const uploadAttachment = useCallback(async (file: File) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.uploadAttachment(file)
  }, [chatManager])

  const editMessage = useCallback(async (messageId: MessageId, newContent: string) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.editMessage(messageId, newContent)
  }, [chatManager])

  const deleteMessage = useCallback(async (messageId: MessageId) => {
    if (!chatManager) throw new Error('Chat manager not initialized')
    return await chatManager.deleteMessage(messageId)
  }, [chatManager])

  const addReaction = useCallback(async (messageId: MessageId, emoji: string) => {
    if (!chatManager) return
    return await chatManager.addReaction(messageId, emoji)
  }, [chatManager])

  // Convert Map to Array for easier React usage
  const rooms = useMemo(() => Array.from(chatState.rooms.values()), [chatState.rooms])
  const getMessages = useCallback((chatId: ChatId) => chatState.messages.get(chatId) || [], [chatState.messages])
  const getTypingUsers = useCallback((chatId: ChatId) => chatState.typing.get(chatId) || [], [chatState.typing])

  return {
    chatManager,
    rooms,
    getMessages,
    getTypingUsers,
    sendMessage,
    joinChat,
    createChat,
    startTyping,
    stopTyping,
    markAsRead,
    uploadAttachment,
    editMessage,
    deleteMessage,
    addReaction,
    isLoading: (chatId: ChatId) => chatState.loading.get(chatId) || false,
    error: chatState.error,
  }
}

// Specific chat room hook
export function useChatRoom(chatId: ChatId, client: RealtimeClient | null) {
  const { chatManager, getMessages, getTypingUsers, ...chatActions } = useChat(client)
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatManager || !chatId) return

    setLoading(true)
    
    chatManager.joinChat(chatId)
      .then(() => {
        const chatState = chatManager.getState()
        const roomData = chatState.rooms.get(chatId)
        setRoom(roomData || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Subscribe to room updates
    const unsubscribe = chatManager.subscribe((state) => {
      const roomData = state.rooms.get(chatId)
      setRoom(roomData || null)
    })

    return unsubscribe
  }, [chatManager, chatId])

  const messages = getMessages(chatId)
  const typingUsers = getTypingUsers(chatId)

  return {
    room,
    messages,
    typingUsers,
    loading,
    ...chatActions,
  }
}

// Typing indicator hook
export function useTypingIndicator(chatId: ChatId, client: RealtimeClient | null) {
  const { startTyping, stopTyping, getTypingUsers } = useChat(client)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleTyping = useCallback(async () => {
    if (!isTyping) {
      setIsTyping(true)
      await startTyping(chatId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await stopTyping(chatId)
    }, 3000)
  }, [chatId, isTyping, startTyping, stopTyping])

  const handleStopTyping = useCallback(async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    if (isTyping) {
      setIsTyping(false)
      await stopTyping(chatId)
    }
  }, [chatId, isTyping, stopTyping])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const typingUsers = getTypingUsers(chatId)

  return {
    isTyping,
    typingUsers,
    handleTyping,
    handleStopTyping,
  }
}

// Presence hook
export function usePresence(client: RealtimeClient | null) {
  const [presenceState, setPresenceState] = useState<Map<UserId, UserPresence>>(new Map())
  const [currentUser, setCurrentUser] = useState<UserPresence | null>(null)

  useEffect(() => {
    if (!client) return

    const updatePresenceState = () => {
      const state = client.getState()
      setPresenceState(new Map(state.presence.users))
      setCurrentUser(state.presence.currentUser || null)
    }

    // Initial update
    updatePresenceState()

    // Listen for presence events
    const unsubscribeOnline = client.on('presence:user:online', updatePresenceState)
    const unsubscribeOffline = client.on('presence:user:offline', updatePresenceState)

    return () => {
      unsubscribeOnline()
      unsubscribeOffline()
    }
  }, [client])

  const updatePresence = useCallback(async (presence: Partial<UserPresence>) => {
    if (client) {
      await client.updatePresence(presence)
    }
  }, [client])

  const getUserPresence = useCallback((userId: UserId) => {
    return presenceState.get(userId)
  }, [presenceState])

  const isUserOnline = useCallback((userId: UserId) => {
    const presence = presenceState.get(userId)
    return presence?.status === 'online'
  }, [presenceState])

  const onlineUsers = useMemo(() => {
    return Array.from(presenceState.values()).filter(p => p.status === 'online')
  }, [presenceState])

  return {
    currentUser,
    presenceState: Array.from(presenceState.values()),
    onlineUsers,
    getUserPresence,
    isUserOnline,
    updatePresence,
  }
}

// Notifications hook
export function useNotifications(client: RealtimeClient | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!client) return

    const handleNewNotification = (event: any) => {
      const notification = event.data as Notification
      setNotifications(prev => [notification, ...prev])
      
      if (!notification.read) {
        setUnreadCount(prev => prev + 1)
      }
    }

    const handleNotificationRead = (event: any) => {
      const notification = event.data as Notification
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const handleNotificationCleared = (event: any) => {
      const { notificationId } = event.data
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }

    const unsubscribeNew = client.on('notification:new', handleNewNotification)
    const unsubscribeRead = client.on('notification:read', handleNotificationRead)
    const unsubscribeCleared = client.on('notification:cleared', handleNotificationCleared)

    // Load initial notifications
    loadNotifications()

    return () => {
      unsubscribeNew()
      unsubscribeRead()
      unsubscribeCleared()
    }
  }, [client])

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/notifications', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/realtime/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/realtime/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const clearNotification = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/realtime/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      })
    } catch (error) {
      console.error('Failed to clear notification:', error)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    reload: loadNotifications,
  }
}

// Connection status hook
export function useConnectionStatus(client: RealtimeClient | null) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastConnected, setLastConnected] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  useEffect(() => {
    if (!client) return

    const handleStatusChange = (event: any) => {
      setStatus(event.data.status)
      
      if (event.data.status === 'connected') {
        setLastConnected(new Date().toISOString())
        setReconnectAttempts(0)
      } else if (event.data.status === 'reconnecting') {
        setReconnectAttempts(event.data.reconnectAttempt || 0)
      }
    }

    // Initial status
    setStatus(client.getConnectionStatus())

    const unsubscribe = client.on('connection:status', handleStatusChange)

    return unsubscribe
  }, [client])

  return {
    status,
    lastConnected,
    reconnectAttempts,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error',
  }
}

// Utility hook for auto-scroll in chat
export function useAutoScroll(dependency: any, threshold = 100) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsAtBottom(atBottom)
  }, [threshold])

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
  }, [dependency, isAtBottom, scrollToBottom])

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
  }
}

// File upload hook with progress
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File): Promise<MessageAttachment> => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/realtime/chat/attachments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const attachment = await response.json()
      setProgress(100)
      return attachment
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    uploading,
    progress,
    error,
    uploadFile,
    reset,
  }
}

// Helper function (would be replaced with actual auth integration)
async function getAuthToken(): Promise<string> {
  // This would integrate with your auth system
  return 'user-auth-token'
}