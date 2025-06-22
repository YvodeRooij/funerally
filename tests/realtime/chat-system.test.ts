/**
 * CHAT SYSTEM TESTS - COMPREHENSIVE REAL-TIME CHAT TESTING
 * 
 * Purpose: Test chat functionality, messaging, typing indicators, file sharing
 * Features: Message delivery, read receipts, reactions, file attachments
 * Test Scenarios: Normal chat flow, concurrent users, message ordering, offline scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { ChatManager, ChatRoom, ChatParticipant } from '@/lib/realtime/chat'
import { ChatMessage, MessageAttachment } from '@/lib/realtime/types'
import { EVENTS, CHANNELS, MESSAGE_LIMITS } from '@/lib/realtime/config'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Chat System Tests', () => {
    let server: WS
    let client: RealtimeClient
    let chatManager: ChatManager
    let mockFetch: any

    beforeAll(() => {
        mockFetch = vi.mocked(fetch)
    })

    beforeEach(() => {
        server = new WS('ws://localhost:3001')
        
        client = new RealtimeClient({
            userId: 'family-user-123',
            userName: 'Family Member',
            userRole: 'family',
            sessionId: 'session-123',
            provider: 'websocket'
        })

        chatManager = new ChatManager(client)

        // Reset fetch mock
        mockFetch.mockReset()
    })

    afterEach(() => {
        if (client) {
            client.disconnect()
        }
        if (chatManager) {
            chatManager.destroy()
        }
        WS.clean()
    })

    describe('Chat Room Management', () => {
        it('should create family-director chat room', async () => {
            const mockRoom: ChatRoom = {
                id: 'family-123-director-456',
                type: 'family-director',
                participants: [
                    {
                        userId: 'family-123',
                        userName: 'Family Member',
                        userRole: 'family',
                        isOnline: true,
                        lastSeen: new Date().toISOString(),
                        isTyping: false
                    },
                    {
                        userId: 'director-456',
                        userName: 'Funeral Director',
                        userRole: 'director',
                        isOnline: true,
                        lastSeen: new Date().toISOString(),
                        isTyping: false
                    }
                ],
                unreadCount: 0,
                isArchived: false,
                metadata: {
                    familyId: 'family-123',
                    directorId: 'director-456',
                    caseId: 'case-789'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRoom
            })

            const room = await chatManager.createChat(
                ['family-123', 'director-456'],
                {
                    familyId: 'family-123',
                    directorId: 'director-456',
                    caseId: 'case-789'
                }
            )

            expect(room).toEqual(mockRoom)
            expect(mockFetch).toHaveBeenCalledWith('/api/realtime/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify({
                    participants: ['family-123', 'director-456'],
                    metadata: {
                        familyId: 'family-123',
                        directorId: 'director-456',
                        caseId: 'case-789'
                    },
                    type: 'family-director'
                })
            })
        })

        it('should join existing chat room', async () => {
            const mockRoom: ChatRoom = {
                id: 'existing-chat-123',
                type: 'family-director',
                participants: [],
                unreadCount: 5,
                isArchived: false,
                metadata: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            const mockMessages: ChatMessage[] = [
                {
                    id: 'msg-1',
                    chatId: 'existing-chat-123',
                    senderId: 'director-456',
                    senderName: 'Funeral Director',
                    senderRole: 'director',
                    content: 'Hello, how can I help you today?',
                    type: 'text',
                    timestamp: new Date().toISOString(),
                    readBy: [],
                    status: 'delivered',
                    reactions: []
                }
            ]

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockRoom
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockMessages
                })

            await client.connect()
            await server.connected

            await chatManager.joinChat('existing-chat-123')

            const state = chatManager.getState()
            expect(state.rooms.get('existing-chat-123')).toEqual(mockRoom)
            expect(state.messages.get('existing-chat-123')).toEqual(mockMessages)
        })

        it('should handle chat room creation failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Forbidden'
            })

            try {
                await chatManager.createChat(['family-123', 'director-456'], {})
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.message).toContain('Failed to create chat: Forbidden')
            }
        })
    })

    describe('Message Sending and Receiving', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should send text messages successfully', async () => {
            const chatId = 'test-chat-123'
            const content = 'Hello, this is a test message!'

            const sendPromise = chatManager.sendMessage(chatId, content)

            // Simulate server acknowledging the message
            server.send(JSON.stringify({
                channel: CHANNELS.FAMILY_DIRECTOR_CHAT(chatId, ''),
                event: EVENTS.MESSAGE_SENT,
                data: {
                    id: 'msg-123',
                    chatId,
                    senderId: 'family-user-123',
                    senderName: 'Family Member',
                    senderRole: 'family',
                    content,
                    type: 'text',
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                }
            }))

            const messageId = await sendPromise
            expect(messageId).toBeDefined()

            const state = chatManager.getState()
            const messages = state.messages.get(chatId)
            expect(messages).toHaveLength(1)
            expect(messages![0].content).toBe(content)
            expect(messages![0].status).toBe('sent')
        })

        it('should handle message sending failures', async () => {
            const chatId = 'test-chat-123'
            const content = 'This message will fail'

            // Simulate connection error
            server.close()

            try {
                await chatManager.sendMessage(chatId, content)
            } catch (error) {
                // Message should be marked as failed in local state
                const state = chatManager.getState()
                const messages = state.messages.get(chatId)
                expect(messages![0].status).toBe('failed')
            }
        })

        it('should enforce message length limits', async () => {
            const chatId = 'test-chat-123'
            const longContent = 'a'.repeat(MESSAGE_LIMITS.MAX_MESSAGE_LENGTH + 1)

            try {
                await chatManager.sendMessage(chatId, longContent)
                expect.fail('Should have thrown error for message too long')
            } catch (error: any) {
                expect(error.message).toContain('Message too long')
            }
        })

        it('should handle incoming messages', async () => {
            const chatId = 'test-chat-123'
            const incomingMessage: ChatMessage = {
                id: 'msg-incoming-123',
                chatId,
                senderId: 'director-456',
                senderName: 'Funeral Director',
                senderRole: 'director',
                content: 'Hello from the director!',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'received',
                reactions: []
            }

            // Subscribe to message events
            const receivedMessages: ChatMessage[] = []
            chatManager.subscribe((state) => {
                const messages = state.messages.get(chatId)
                if (messages && messages.length > 0) {
                    receivedMessages.push(messages[messages.length - 1])
                }
            })

            // Simulate incoming message
            server.send(JSON.stringify({
                type: EVENTS.MESSAGE_RECEIVED,
                timestamp: new Date().toISOString(),
                userId: 'director-456',
                sessionId: 'director-session',
                data: incomingMessage
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            expect(receivedMessages).toHaveLength(1)
            expect(receivedMessages[0]).toEqual(incomingMessage)
        })

        it('should maintain message order with concurrent sends', async () => {
            const chatId = 'test-chat-123'
            const messages = ['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5']

            // Send multiple messages rapidly
            const sendPromises = messages.map((content, index) => 
                chatManager.sendMessage(chatId, content)
            )

            // Simulate server responses in order
            messages.forEach((content, index) => {
                server.send(JSON.stringify({
                    channel: CHANNELS.FAMILY_DIRECTOR_CHAT(chatId, ''),
                    event: EVENTS.MESSAGE_SENT,
                    data: {
                        id: `msg-${index}`,
                        chatId,
                        senderId: 'family-user-123',
                        content,
                        timestamp: new Date(Date.now() + index * 1000).toISOString()
                    }
                }))
            })

            await Promise.all(sendPromises)

            const state = chatManager.getState()
            const chatMessages = state.messages.get(chatId)!
            
            expect(chatMessages).toHaveLength(5)
            chatMessages.forEach((message, index) => {
                expect(message.content).toBe(messages[index])
            })
        })
    })

    describe('Typing Indicators', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should send typing indicators', async () => {
            const chatId = 'test-chat-123'

            await chatManager.startTyping(chatId)

            expect(server).toHaveReceivedMessage(
                expect.objectContaining({
                    channel: CHANNELS.CHAT_PRESENCE(chatId),
                    event: EVENTS.MESSAGE_TYPING,
                    data: expect.objectContaining({
                        chatId,
                        userId: 'family-user-123',
                        isTyping: true
                    })
                })
            )
        })

        it('should automatically stop typing after timeout', async () => {
            const chatId = 'test-chat-123'

            await chatManager.startTyping(chatId)

            // Wait for auto-stop timeout (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 5100))

            expect(server).toHaveReceivedMessage(
                expect.objectContaining({
                    channel: CHANNELS.CHAT_PRESENCE(chatId),
                    event: EVENTS.MESSAGE_STOP_TYPING,
                    data: expect.objectContaining({
                        chatId,
                        userId: 'family-user-123',
                        isTyping: false
                    })
                })
            )
        })

        it('should handle incoming typing indicators', async () => {
            const chatId = 'test-chat-123'

            // Simulate incoming typing indicator
            server.send(JSON.stringify({
                type: EVENTS.MESSAGE_TYPING,
                data: {
                    chatId,
                    userId: 'director-456',
                    userName: 'Funeral Director',
                    isTyping: true
                }
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = chatManager.getState()
            const typingUsers = state.typing.get(chatId)
            expect(typingUsers).toContain('director-456')
        })
    })

    describe('File Attachments', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should upload file attachments', async () => {
            const mockFile = new File(['file content'], 'test.pdf', { type: 'application/pdf' })
            const mockAttachment: MessageAttachment = {
                id: 'attachment-123',
                name: 'test.pdf',
                type: 'application/pdf',
                size: 12,
                url: 'https://example.com/files/test.pdf',
                thumbnailUrl: 'https://example.com/thumbs/test.pdf'
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAttachment
            })

            const attachment = await chatManager.uploadAttachment(mockFile)

            expect(attachment).toEqual(mockAttachment)
            expect(mockFetch).toHaveBeenCalledWith('/api/realtime/chat/attachments', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer user-auth-token'
                },
                body: expect.any(FormData)
            })
        })

        it('should enforce file size limits', async () => {
            const largeContent = new Array(MESSAGE_LIMITS.MAX_ATTACHMENT_SIZE + 1).fill('a').join('')
            const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' })

            try {
                await chatManager.uploadAttachment(largeFile)
                expect.fail('Should have thrown error for file too large')
            } catch (error: any) {
                expect(error.message).toContain('File too large')
            }
        })

        it('should send messages with attachments', async () => {
            const chatId = 'test-chat-123'
            const content = 'Check out this document'
            const attachments: MessageAttachment[] = [{
                id: 'attachment-123',
                name: 'document.pdf',
                type: 'application/pdf',
                size: 1024,
                url: 'https://example.com/files/document.pdf'
            }]

            await chatManager.sendMessage(chatId, content, 'text', attachments)

            const state = chatManager.getState()
            const messages = state.messages.get(chatId)!
            expect(messages[0].attachments).toEqual(attachments)
        })

        it('should enforce attachment count limits', async () => {
            const chatId = 'test-chat-123'
            const content = 'Too many attachments'
            const attachments = new Array(MESSAGE_LIMITS.MAX_ATTACHMENTS_PER_MESSAGE + 1).fill({
                id: 'attachment',
                name: 'file.txt',
                type: 'text/plain',
                size: 100,
                url: 'https://example.com/file.txt'
            })

            try {
                await chatManager.sendMessage(chatId, content, 'text', attachments)
                expect.fail('Should have thrown error for too many attachments')
            } catch (error: any) {
                expect(error.message).toContain('Too many attachments')
            }
        })
    })

    describe('Message Reactions', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should add reactions to messages', async () => {
            const messageId = 'msg-123'
            const emoji = '👍'

            // Mock existing message in cache
            const existingMessage: ChatMessage = {
                id: messageId,
                chatId: 'test-chat',
                senderId: 'director-456',
                senderName: 'Director',
                senderRole: 'director',
                content: 'Test message',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: []
            }

            // Add message to cache
            chatManager['messageCache'].set(messageId, existingMessage)

            mockFetch.mockResolvedValueOnce({ ok: true })

            await chatManager.addReaction(messageId, emoji)

            expect(existingMessage.reactions).toHaveLength(1)
            expect(existingMessage.reactions![0].emoji).toBe(emoji)
            expect(existingMessage.reactions![0].userId).toBe('family-user-123')
        })

        it('should remove reactions when reacting with same emoji', async () => {
            const messageId = 'msg-123'
            const emoji = '👍'

            // Mock existing message with reaction
            const existingMessage: ChatMessage = {
                id: messageId,
                chatId: 'test-chat',
                senderId: 'director-456',
                senderName: 'Director',
                senderRole: 'director',
                content: 'Test message',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: [{
                    emoji,
                    userId: 'family-user-123',
                    userName: 'Family Member',
                    timestamp: new Date().toISOString()
                }]
            }

            chatManager['messageCache'].set(messageId, existingMessage)
            mockFetch.mockResolvedValueOnce({ ok: true })

            await chatManager.addReaction(messageId, emoji)

            expect(existingMessage.reactions).toHaveLength(0)
        })
    })

    describe('Read Receipts', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should mark messages as read', async () => {
            const chatId = 'test-chat-123'
            const messageId = 'msg-123'

            // Mock chat room
            const mockRoom: ChatRoom = {
                id: chatId,
                type: 'family-director',
                participants: [],
                unreadCount: 5,
                isArchived: false,
                metadata: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            chatManager.getState().rooms.set(chatId, mockRoom)

            mockFetch.mockResolvedValueOnce({ ok: true })

            await chatManager.markAsRead(chatId, messageId)

            expect(mockRoom.unreadCount).toBe(0)
            expect(mockFetch).toHaveBeenCalledWith('/api/realtime/chat/read-receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify({
                    chatId,
                    messageId,
                    timestamp: expect.any(String)
                })
            })
        })

        it('should handle incoming read receipts', async () => {
            const messageId = 'msg-123'
            const readReceipt = {
                messageId,
                userId: 'director-456',
                timestamp: new Date().toISOString()
            }

            // Mock message in cache
            const existingMessage: ChatMessage = {
                id: messageId,
                chatId: 'test-chat',
                senderId: 'family-user-123',
                senderName: 'Family Member',
                senderRole: 'family',
                content: 'Test message',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: []
            }

            chatManager['messageCache'].set(messageId, existingMessage)

            // Simulate incoming read receipt
            server.send(JSON.stringify({
                type: 'chat:message:read',
                data: readReceipt
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            expect(existingMessage.readBy).toHaveLength(1)
            expect(existingMessage.readBy![0].userId).toBe('director-456')
        })
    })

    describe('Message Editing and Deletion', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should edit messages', async () => {
            const messageId = 'msg-123'
            const newContent = 'Edited message content'

            // Mock existing message
            const existingMessage: ChatMessage = {
                id: messageId,
                chatId: 'test-chat',
                senderId: 'family-user-123',
                senderName: 'Family Member',
                senderRole: 'family',
                content: 'Original content',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: []
            }

            chatManager['messageCache'].set(messageId, existingMessage)
            mockFetch.mockResolvedValueOnce({ ok: true })

            await chatManager.editMessage(messageId, newContent)

            expect(existingMessage.content).toBe(newContent)
            expect(existingMessage.editedAt).toBeDefined()
        })

        it('should delete messages', async () => {
            const messageId = 'msg-123'
            const chatId = 'test-chat'

            // Mock existing message
            const existingMessage: ChatMessage = {
                id: messageId,
                chatId,
                senderId: 'family-user-123',
                senderName: 'Family Member',
                senderRole: 'family',
                content: 'Message to delete',
                type: 'text',
                timestamp: new Date().toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: []
            }

            chatManager['messageCache'].set(messageId, existingMessage)
            chatManager.getState().messages.set(chatId, [existingMessage])

            mockFetch.mockResolvedValueOnce({ ok: true })

            await chatManager.deleteMessage(messageId)

            expect(chatManager['messageCache'].has(messageId)).toBe(false)
            expect(chatManager.getState().messages.get(chatId)).toHaveLength(0)
        })
    })

    describe('Offline and Network Issues', () => {
        it('should handle sending messages while offline', async () => {
            const chatId = 'test-chat-123'
            const content = 'Offline message'

            // Don't connect client (simulate offline)
            const sendPromise = chatManager.sendMessage(chatId, content)

            // Message should be queued
            const state = chatManager.getState()
            const messages = state.messages.get(chatId)!
            expect(messages[0].status).toBe('sending')

            // Connect and verify message is sent
            await client.connect()
            await server.connected

            // Wait for message to be processed
            await new Promise(resolve => setTimeout(resolve, 100))

            expect(messages[0].status).toBe('sent')
        })

        it('should handle intermittent connectivity during chat', async () => {
            const chatId = 'test-chat-123'

            await client.connect()
            await server.connected

            // Send first message successfully
            await chatManager.sendMessage(chatId, 'Message 1')

            // Simulate connection loss
            server.close()

            // Try to send second message (should queue)
            const sendPromise = chatManager.sendMessage(chatId, 'Message 2')

            // Reconnect
            server = new WS('ws://localhost:3001')
            await server.connected

            // Wait for queued message to be sent
            await sendPromise

            const state = chatManager.getState()
            const messages = state.messages.get(chatId)!
            expect(messages).toHaveLength(2)
            expect(messages[1].content).toBe('Message 2')
        })
    })

    describe('Performance and Scalability', () => {
        it('should handle large message history', async () => {
            const chatId = 'test-chat-123'
            const messageCount = 1000

            // Mock large message history
            const mockMessages: ChatMessage[] = Array.from({ length: messageCount }, (_, i) => ({
                id: `msg-${i}`,
                chatId,
                senderId: `user-${i % 2}`,
                senderName: `User ${i % 2}`,
                senderRole: 'family',
                content: `Message ${i}`,
                type: 'text',
                timestamp: new Date(Date.now() - (messageCount - i) * 1000).toISOString(),
                readBy: [],
                status: 'delivered',
                reactions: []
            }))

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: chatId,
                    type: 'family-director',
                    participants: [],
                    unreadCount: 0,
                    isArchived: false,
                    metadata: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
            }).mockResolvedValueOnce({
                ok: true,
                json: async () => mockMessages
            })

            await client.connect()
            await server.connected

            const startTime = Date.now()
            await chatManager.joinChat(chatId)
            const endTime = Date.now()

            // Should load large history efficiently (under 1 second)
            expect(endTime - startTime).toBeLessThan(1000)

            const state = chatManager.getState()
            expect(state.messages.get(chatId)).toHaveLength(messageCount)
        })

        it('should handle rapid message sending', async () => {
            const chatId = 'test-chat-123'
            const messageCount = 100

            await client.connect()
            await server.connected

            const startTime = Date.now()
            
            // Send many messages rapidly
            const sendPromises = Array.from({ length: messageCount }, (_, i) =>
                chatManager.sendMessage(chatId, `Rapid message ${i}`)
            )

            await Promise.all(sendPromises)
            const endTime = Date.now()

            // Should handle rapid sending efficiently
            expect(endTime - startTime).toBeLessThan(5000)

            const state = chatManager.getState()
            expect(state.messages.get(chatId)).toHaveLength(messageCount)
        })
    })
})