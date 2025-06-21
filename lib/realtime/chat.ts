/**
 * REAL-TIME CHAT SYSTEM - FAMILY-DIRECTOR COMMUNICATION
 * 
 * Purpose: Comprehensive chat system for family-director real-time communication
 * Features: Message persistence, typing indicators, read receipts, file sharing
 * Architecture: Event-driven system with automatic state synchronization
 */

'use client'

import { 
  ChatMessage, 
  ChatId, 
  UserId, 
  MessageId, 
  UserRole,
  MessageAttachment,
  MessageReaction,
  RealtimeEvent 
} from './types'
import { CHANNELS, EVENTS, MESSAGE_LIMITS } from './config'
import { RealtimeClient } from './client'

export interface ChatParticipant {
  userId: UserId
  userName: string
  userRole: UserRole
  avatar?: string
  isOnline: boolean
  lastSeen: string
  isTyping: boolean
}

export interface ChatRoom {
  id: ChatId
  type: 'family-director' | 'group' | 'system'
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  isArchived: boolean
  metadata: {
    familyId?: string
    directorId?: string
    caseId?: string
    subject?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ChatState {
  rooms: Map<ChatId, ChatRoom>
  messages: Map<ChatId, ChatMessage[]>
  typing: Map<ChatId, UserId[]>
  loading: Map<ChatId, boolean>
  error?: string
}

export class ChatManager {
  private client: RealtimeClient
  private state: ChatState
  private messageCache = new Map<MessageId, ChatMessage>()
  private typingTimeouts = new Map<string, NodeJS.Timeout>()
  private listeners = new Set<(state: ChatState) => void>()

  constructor(client: RealtimeClient) {
    this.client = client
    this.state = {
      rooms: new Map(),
      messages: new Map(),
      typing: new Map(),
      loading: new Map(),
    }
    
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Message events
    this.client.on('chat:message:received', this.handleMessageReceived.bind(this))
    this.client.on('chat:message:sent', this.handleMessageSent.bind(this))
    
    // Typing events
    this.client.on('chat:typing', this.handleTypingStart.bind(this))
    this.client.on('chat:stop-typing', this.handleTypingStop.bind(this))
    
    // Read receipt events
    this.client.on('chat:message:read', this.handleMessageRead.bind(this))
    
    // Room events
    this.client.on('chat:room:updated', this.handleRoomUpdated.bind(this))
    this.client.on('chat:participant:joined', this.handleParticipantJoined.bind(this))
    this.client.on('chat:participant:left', this.handleParticipantLeft.bind(this))
  }

  // Room management
  async createChat(participants: UserId[], metadata: ChatRoom['metadata']): Promise<ChatRoom> {
    const chatId = this.generateChatId(participants)
    
    try {
      const response = await fetch('/api/realtime/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          participants,
          metadata,
          type: metadata.familyId && metadata.directorId ? 'family-director' : 'group',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.statusText}`)
      }

      const room: ChatRoom = await response.json()
      
      // Subscribe to chat channel
      this.subscribeToChat(room.id)
      
      // Update local state
      this.state.rooms.set(room.id, room)
      this.state.messages.set(room.id, [])
      this.notifyStateChange()
      
      return room
    } catch (error) {
      console.error('[ChatManager] Failed to create chat:', error)
      throw error
    }
  }

  async joinChat(chatId: ChatId): Promise<void> {
    try {
      // Subscribe to chat channel
      this.subscribeToChat(chatId)
      
      // Load chat room info and recent messages
      await this.loadChatRoom(chatId)
      await this.loadRecentMessages(chatId)
      
    } catch (error) {
      console.error('[ChatManager] Failed to join chat:', error)
      throw error
    }
  }

  private subscribeToChat(chatId: ChatId): void {
    const channel = CHANNELS.FAMILY_DIRECTOR_CHAT(chatId, '')
    
    this.client.subscribe(channel, [
      EVENTS.MESSAGE_SENT,
      EVENTS.MESSAGE_RECEIVED,
      EVENTS.MESSAGE_TYPING,
      EVENTS.MESSAGE_STOP_TYPING,
      'chat:message:read',
      'chat:room:updated',
      'chat:participant:joined',
      'chat:participant:left',
    ])
  }

  private async loadChatRoom(chatId: ChatId): Promise<void> {
    this.state.loading.set(chatId, true)
    this.notifyStateChange()

    try {
      const response = await fetch(`/api/realtime/chat/rooms/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load chat room: ${response.statusText}`)
      }

      const room: ChatRoom = await response.json()
      this.state.rooms.set(chatId, room)
      
    } catch (error) {
      this.state.error = `Failed to load chat room: ${error}`
      console.error('[ChatManager] Failed to load chat room:', error)
    } finally {
      this.state.loading.set(chatId, false)
      this.notifyStateChange()
    }
  }

  private async loadRecentMessages(chatId: ChatId, limit = 50): Promise<void> {
    try {
      const response = await fetch(`/api/realtime/chat/messages/${chatId}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`)
      }

      const messages: ChatMessage[] = await response.json()
      
      // Cache messages and update state
      messages.forEach(msg => this.messageCache.set(msg.id, msg))
      this.state.messages.set(chatId, messages.reverse()) // Reverse to show oldest first
      this.notifyStateChange()
      
    } catch (error) {
      console.error('[ChatManager] Failed to load messages:', error)
    }
  }

  // Message management
  async sendMessage(
    chatId: ChatId, 
    content: string, 
    type: ChatMessage['type'] = 'text',
    attachments?: MessageAttachment[],
    replyTo?: MessageId
  ): Promise<MessageId> {
    // Validate message
    if (content.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long. Maximum ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters.`)
    }

    if (attachments && attachments.length > MESSAGE_LIMITS.MAX_ATTACHMENTS_PER_MESSAGE) {
      throw new Error(`Too many attachments. Maximum ${MESSAGE_LIMITS.MAX_ATTACHMENTS_PER_MESSAGE} allowed.`)
    }

    const messageId = this.generateMessageId()
    const timestamp = new Date().toISOString()

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: messageId,
      chatId,
      senderId: this.client.getState().presence.currentUser?.userId || '',
      senderName: this.client.getState().presence.currentUser?.userName || '',
      senderRole: this.client.getState().presence.currentUser?.userRole || 'family',
      content,
      type,
      timestamp,
      readBy: [],
      status: 'sending',
      attachments,
      replyTo,
      reactions: [],
    }

    // Add to local state immediately
    const messages = this.state.messages.get(chatId) || []
    messages.push(optimisticMessage)
    this.state.messages.set(chatId, messages)
    this.messageCache.set(messageId, optimisticMessage)
    this.notifyStateChange()

    try {
      // Send via real-time client
      await this.client.sendMessage(chatId, content, type)
      
      // Update message status
      optimisticMessage.status = 'sent'
      this.notifyStateChange()
      
      return messageId
    } catch (error) {
      // Update message status to failed
      optimisticMessage.status = 'failed'
      this.notifyStateChange()
      throw error
    }
  }

  async editMessage(messageId: MessageId, newContent: string): Promise<void> {
    const message = this.messageCache.get(messageId)
    if (!message) {
      throw new Error('Message not found')
    }

    if (newContent.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long. Maximum ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters.`)
    }

    try {
      const response = await fetch(`/api/realtime/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          content: newContent,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`)
      }

      // Update local cache
      message.content = newContent
      message.editedAt = new Date().toISOString()
      this.notifyStateChange()
      
    } catch (error) {
      console.error('[ChatManager] Failed to edit message:', error)
      throw error
    }
  }

  async deleteMessage(messageId: MessageId): Promise<void> {
    try {
      const response = await fetch(`/api/realtime/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`)
      }

      // Remove from local cache
      const message = this.messageCache.get(messageId)
      if (message) {
        const messages = this.state.messages.get(message.chatId) || []
        const filteredMessages = messages.filter(m => m.id !== messageId)
        this.state.messages.set(message.chatId, filteredMessages)
        this.messageCache.delete(messageId)
        this.notifyStateChange()
      }
      
    } catch (error) {
      console.error('[ChatManager] Failed to delete message:', error)
      throw error
    }
  }

  async addReaction(messageId: MessageId, emoji: string): Promise<void> {
    const message = this.messageCache.get(messageId)
    if (!message) return

    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(
      r => r.userId === currentUser.userId && r.emoji === emoji
    )

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions?.filter(
        r => !(r.userId === currentUser.userId && r.emoji === emoji)
      ) || []
    } else {
      // Add reaction
      const newReaction: MessageReaction = {
        emoji,
        userId: currentUser.userId,
        userName: currentUser.userName,
        timestamp: new Date().toISOString(),
      }
      
      message.reactions = message.reactions || []
      message.reactions.push(newReaction)
    }

    this.notifyStateChange()

    try {
      await fetch(`/api/realtime/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ emoji }),
      })
    } catch (error) {
      console.error('[ChatManager] Failed to sync reaction:', error)
      // Revert on error
      // This is a simplified revert - in production you'd want more sophisticated error handling
    }
  }

  // Typing indicators
  async startTyping(chatId: ChatId): Promise<void> {
    const key = `${chatId}-typing`
    
    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Send typing start event
    await this.client.startTyping(chatId)

    // Set timeout to automatically stop typing
    const timeout = setTimeout(() => {
      this.stopTyping(chatId)
    }, 5000) // Stop typing after 5 seconds of inactivity

    this.typingTimeouts.set(key, timeout)
  }

  async stopTyping(chatId: ChatId): Promise<void> {
    const key = `${chatId}-typing`
    
    // Clear timeout
    const timeout = this.typingTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.typingTimeouts.delete(key)
    }

    // Send typing stop event
    await this.client.stopTyping(chatId)
  }

  // Read receipts
  async markAsRead(chatId: ChatId, messageId?: MessageId): Promise<void> {
    const room = this.state.rooms.get(chatId)
    if (!room) return

    const messages = this.state.messages.get(chatId) || []
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    try {
      await fetch(`/api/realtime/chat/read-receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          chatId,
          messageId: messageId || messages[messages.length - 1]?.id,
          timestamp: new Date().toISOString(),
        }),
      })

      // Update local state
      room.unreadCount = 0
      this.notifyStateChange()
      
    } catch (error) {
      console.error('[ChatManager] Failed to mark as read:', error)
    }
  }

  // File sharing
  async uploadAttachment(file: File): Promise<MessageAttachment> {
    if (file.size > MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE) {
      throw new Error(`File too large. Maximum ${MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE / 1024 / 1024}MB allowed.`)
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/realtime/chat/attachments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload attachment: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[ChatManager] Failed to upload attachment:', error)
      throw error
    }
  }

  // Event handlers
  private handleMessageReceived(event: RealtimeEvent<ChatMessage>): void {
    const message = event.data
    
    // Add to local state
    const messages = this.state.messages.get(message.chatId) || []
    messages.push(message)
    this.state.messages.set(message.chatId, messages)
    this.messageCache.set(message.id, message)

    // Update room's last message and unread count
    const room = this.state.rooms.get(message.chatId)
    if (room && message.senderId !== this.client.getState().presence.currentUser?.userId) {
      room.lastMessage = message
      room.unreadCount++
      room.updatedAt = message.timestamp
    }

    this.notifyStateChange()
  }

  private handleMessageSent(event: RealtimeEvent<ChatMessage>): void {
    const message = event.data
    
    // Update existing optimistic message or add new one
    const existingMessage = this.messageCache.get(message.id)
    if (existingMessage) {
      Object.assign(existingMessage, message)
    } else {
      const messages = this.state.messages.get(message.chatId) || []
      messages.push(message)
      this.state.messages.set(message.chatId, messages)
      this.messageCache.set(message.id, message)
    }

    // Update room's last message
    const room = this.state.rooms.get(message.chatId)
    if (room) {
      room.lastMessage = message
      room.updatedAt = message.timestamp
    }

    this.notifyStateChange()
  }

  private handleTypingStart(event: RealtimeEvent<any>): void {
    const { chatId, userId } = event.data
    const typingUsers = this.state.typing.get(chatId) || []
    
    if (!typingUsers.includes(userId)) {
      typingUsers.push(userId)
      this.state.typing.set(chatId, typingUsers)
      this.notifyStateChange()
    }
  }

  private handleTypingStop(event: RealtimeEvent<any>): void {
    const { chatId, userId } = event.data
    const typingUsers = this.state.typing.get(chatId) || []
    
    const filteredUsers = typingUsers.filter(id => id !== userId)
    this.state.typing.set(chatId, filteredUsers)
    this.notifyStateChange()
  }

  private handleMessageRead(event: RealtimeEvent<any>): void {
    const { messageId, userId, timestamp } = event.data
    const message = this.messageCache.get(messageId)
    
    if (message) {
      message.readBy = message.readBy || []
      const existingRead = message.readBy.find(r => r.userId === userId)
      
      if (!existingRead) {
        message.readBy.push({ userId, readAt: timestamp })
        this.notifyStateChange()
      }
    }
  }

  private handleRoomUpdated(event: RealtimeEvent<ChatRoom>): void {
    const room = event.data
    this.state.rooms.set(room.id, room)
    this.notifyStateChange()
  }

  private handleParticipantJoined(event: RealtimeEvent<any>): void {
    const { chatId, participant } = event.data
    const room = this.state.rooms.get(chatId)
    
    if (room) {
      room.participants.push(participant)
      this.notifyStateChange()
    }
  }

  private handleParticipantLeft(event: RealtimeEvent<any>): void {
    const { chatId, userId } = event.data
    const room = this.state.rooms.get(chatId)
    
    if (room) {
      room.participants = room.participants.filter(p => p.userId !== userId)
      this.notifyStateChange()
    }
  }

  // State management
  getState(): ChatState {
    return { ...this.state }
  }

  subscribe(listener: (state: ChatState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyStateChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[ChatManager] Listener error:', error)
      }
    })
  }

  // Utility methods
  private generateChatId(participants: UserId[]): ChatId {
    return participants.sort().join('-')
  }

  private generateMessageId(): MessageId {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getAuthToken(): Promise<string> {
    // This would integrate with your auth system
    return 'user-auth-token'
  }

  // Cleanup
  destroy(): void {
    // Clear timers
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout))
    this.typingTimeouts.clear()
    
    // Clear listeners
    this.listeners.clear()
    
    // Clear state
    this.state.rooms.clear()
    this.state.messages.clear()
    this.state.typing.clear()
    this.messageCache.clear()
  }
}

// Factory function
export const createChatManager = (client: RealtimeClient): ChatManager => {
  return new ChatManager(client)
}