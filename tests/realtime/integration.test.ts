/**
 * REAL-TIME INTEGRATION TESTS - COMPREHENSIVE SYSTEM TESTING
 * 
 * Purpose: Test complete real-time system integration with network issues, concurrent users
 * Features: End-to-end scenarios, stress testing, network simulation, message ordering
 * Test Scenarios: Complex workflows, system limits, failure recovery, data consistency
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { ChatManager } from '@/lib/realtime/chat'
import { NotificationManager } from '@/lib/realtime/notifications'
import { PresenceManager } from '@/lib/realtime/presence'
import { CollaborativeManager } from '@/lib/realtime/collaborative-planning'
import { DocumentSharingManager } from '@/lib/realtime/document-sharing'
import { EVENTS, CHANNELS, RATE_LIMITS } from '@/lib/realtime/config'

// Mock fetch and browser APIs
global.fetch = vi.fn()
global.Notification = vi.fn() as any
global.navigator = { onLine: true } as any
global.addEventListener = vi.fn()
global.removeEventListener = vi.fn()

describe('Real-Time Integration Tests', () => {
    let servers: WS[]
    let clients: RealtimeClient[]
    let chatManagers: ChatManager[]
    let notificationManagers: NotificationManager[]
    let presenceManagers: PresenceManager[]
    let collaborativeManagers: CollaborativeManager[]
    let documentSharingManagers: DocumentSharingManager[]
    let mockFetch: any

    beforeAll(() => {
        mockFetch = vi.mocked(fetch)
    })

    beforeEach(() => {
        servers = []
        clients = []
        chatManagers = []
        notificationManagers = []
        presenceManagers = []
        collaborativeManagers = []
        documentSharingManagers = []

        // Reset mocks
        mockFetch.mockReset()
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Cleanup all clients and servers
        clients.forEach(client => client.disconnect())
        servers.forEach(() => WS.clean())
        chatManagers.forEach(manager => manager.destroy())
        notificationManagers.forEach(manager => manager.destroy())
        presenceManagers.forEach(manager => manager.destroy())
        collaborativeManagers.forEach(manager => manager.destroy())
        documentSharingManagers.forEach(manager => manager.destroy())
    })

    // Helper function to create a complete user setup
    const createUser = async (userId: string, userName: string, userRole: string, port: number = 3001) => {
        const server = new WS(`ws://localhost:${port}`)
        const client = new RealtimeClient({
            userId,
            userName,
            userRole,
            sessionId: `session-${userId}`,
            provider: 'websocket'
        })

        const chatManager = new ChatManager(client)
        const notificationManager = new NotificationManager(client)
        const presenceManager = new PresenceManager(client)
        const collaborativeManager = new CollaborativeManager(client)
        const documentSharingManager = new DocumentSharingManager(client)

        await client.connect()
        await server.connected

        servers.push(server)
        clients.push(client)
        chatManagers.push(chatManager)
        notificationManagers.push(notificationManager)
        presenceManagers.push(presenceManager)
        collaborativeManagers.push(collaborativeManager)
        documentSharingManagers.push(documentSharingManager)

        return {
            server,
            client,
            chatManager,
            notificationManager,
            presenceManager,
            collaborativeManager,
            documentSharingManager
        }
    }

    describe('End-to-End Family-Director Communication', () => {
        it('should handle complete funeral planning workflow', async () => {
            // Create family and director users
            const family = await createUser('family-123', 'Jane Doe', 'family')
            const director = await createUser('director-456', 'John Director', 'director', 3002)

            // Mock API responses
            mockFetch.mockImplementation((url: string) => {
                if (url.includes('/chat/rooms')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            id: 'chat-family-director',
                            type: 'family-director',
                            participants: [
                                {
                                    userId: 'family-123',
                                    userName: 'Jane Doe',
                                    userRole: 'family',
                                    isOnline: true,
                                    lastSeen: new Date().toISOString(),
                                    isTyping: false
                                },
                                {
                                    userId: 'director-456',
                                    userName: 'John Director',
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
                        })
                    })
                }
                if (url.includes('/collaborative/sessions')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            id: 'session-planning',
                            documentId: 'funeral-plan-123',
                            participants: ['family-123', 'director-456'],
                            version: 1,
                            content: {
                                type: 'funeral_planning',
                                data: {
                                    serviceDate: '',
                                    venue: '',
                                    arrangements: []
                                }
                            },
                            operations: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })
                    })
                }
                return Promise.resolve({ ok: true })
            })

            // 1. Start presence tracking
            await family.presenceManager.startTracking()
            await director.presenceManager.startTracking()

            // 2. Create family-director chat
            const chatRoom = await family.chatManager.createChat(
                ['family-123', 'director-456'],
                {
                    familyId: 'family-123',
                    directorId: 'director-456',
                    caseId: 'case-789'
                }
            )

            expect(chatRoom.type).toBe('family-director')

            // 3. Director joins the chat
            await director.chatManager.joinChat(chatRoom.id)

            // 4. Exchange messages
            await family.chatManager.sendMessage(chatRoom.id, 'Hello, I need help planning the funeral service.')

            // Simulate director receiving the message
            director.server.send(JSON.stringify({
                type: EVENTS.MESSAGE_RECEIVED,
                data: {
                    id: 'msg-1',
                    chatId: chatRoom.id,
                    senderId: 'family-123',
                    senderName: 'Jane Doe',
                    senderRole: 'family',
                    content: 'Hello, I need help planning the funeral service.',
                    type: 'text',
                    timestamp: new Date().toISOString(),
                    readBy: [],
                    status: 'delivered',
                    reactions: []
                }
            }))

            await director.chatManager.sendMessage(chatRoom.id, 'I\'m here to help. Let\'s start with the service date.')

            // 5. Create collaborative planning session
            const planningSession = await family.collaborativeManager.createSession('funeral-plan-123', {
                type: 'funeral_planning',
                permissions: ['read', 'write', 'comment']
            })

            await director.collaborativeManager.joinSession(planningSession.id)

            // 6. Collaborate on planning document
            await family.collaborativeManager.applyOperation({
                id: 'op-1',
                type: 'update',
                path: ['serviceDate'],
                value: '2024-02-15',
                timestamp: new Date().toISOString(),
                userId: 'family-123',
                sessionId: planningSession.id
            })

            await director.collaborativeManager.applyOperation({
                id: 'op-2',
                type: 'update',
                path: ['venue'],
                value: 'Memorial Chapel',
                timestamp: new Date().toISOString(),
                userId: 'director-456',
                sessionId: planningSession.id
            })

            // 7. Send notification about completion
            await director.notificationManager.send({
                userId: 'family-123',
                title: 'Funeral Plan Updated',
                body: 'The funeral plan has been updated with venue information.',
                type: 'document_updated',
                priority: 'normal',
                data: { documentId: 'funeral-plan-123' },
                read: false
            })

            // Verify the workflow completed successfully
            const familyChatState = family.chatManager.getState()
            const directorChatState = director.chatManager.getState()
            const planningState = family.collaborativeManager.getState()

            expect(familyChatState.rooms.has(chatRoom.id)).toBe(true)
            expect(directorChatState.rooms.has(chatRoom.id)).toBe(true)
            expect(planningState.activeSessions.has(planningSession.id)).toBe(true)
            
            const session = planningState.activeSessions.get(planningSession.id)!
            expect(session.content.data.serviceDate).toBe('2024-02-15')
            expect(session.content.data.venue).toBe('Memorial Chapel')
        })
    })

    describe('Network Issues and Resilience', () => {
        it('should handle intermittent connectivity', async () => {
            const family = await createUser('family-resilience', 'Test Family', 'family')
            const director = await createUser('director-resilience', 'Test Director', 'director', 3002)

            // Start normal communication
            const chatRoom = await family.chatManager.createChat(['family-resilience', 'director-resilience'], {})
            await director.chatManager.joinChat(chatRoom.id)

            // Send initial message
            await family.chatManager.sendMessage(chatRoom.id, 'Initial message')

            // Simulate network issues - disconnect family
            family.server.close()

            // Director tries to send message while family is offline
            await director.chatManager.sendMessage(chatRoom.id, 'Message while family offline')

            // Family comes back online
            family.server = new WS('ws://localhost:3001')
            await family.client.connect()
            await family.server.connected

            // Family sends message after reconnection
            await family.chatManager.sendMessage(chatRoom.id, 'Back online message')

            // Verify messages are properly queued and delivered
            await new Promise(resolve => setTimeout(resolve, 200))

            const familyState = family.chatManager.getState()
            const directorState = director.chatManager.getState()

            expect(familyState.messages.get(chatRoom.id)?.length).toBeGreaterThan(1)
            expect(directorState.messages.get(chatRoom.id)?.length).toBeGreaterThan(1)
        })

        it('should handle high latency scenarios', async () => {
            const family = await createUser('family-latency', 'Family User', 'family')
            const director = await createUser('director-latency', 'Director User', 'director', 3002)

            // Mock high latency by delaying server responses
            const originalSend = family.server.send
            family.server.send = (data: string) => {
                setTimeout(() => originalSend.call(family.server, data), 2000) // 2 second delay
            }

            const chatRoom = await family.chatManager.createChat(['family-latency', 'director-latency'], {})

            const startTime = Date.now()
            await family.chatManager.sendMessage(chatRoom.id, 'High latency test message')
            const endTime = Date.now()

            // Should handle high latency gracefully
            expect(endTime - startTime).toBeGreaterThan(1000)

            const state = family.chatManager.getState()
            const messages = state.messages.get(chatRoom.id)
            expect(messages?.length).toBeGreaterThan(0)
        })

        it('should handle packet loss simulation', async () => {
            const users = await Promise.all([
                createUser('user-packet-1', 'User 1', 'family'),
                createUser('user-packet-2', 'User 2', 'director', 3002)
            ])

            // Simulate packet loss by randomly dropping messages
            let dropCount = 0
            users.forEach((user, index) => {
                const originalSend = user.server.send
                user.server.send = (data: string) => {
                    if (Math.random() > 0.7) { // 30% packet loss
                        dropCount++
                        return // Drop the packet
                    }
                    originalSend.call(user.server, data)
                }
            })

            const chatRoom = await users[0].chatManager.createChat(['user-packet-1', 'user-packet-2'], {})
            await users[1].chatManager.joinChat(chatRoom.id)

            // Send multiple messages to test reliability
            const messagePromises = []
            for (let i = 0; i < 20; i++) {
                messagePromises.push(
                    users[i % 2].chatManager.sendMessage(chatRoom.id, `Message ${i}`)
                )
                await new Promise(resolve => setTimeout(resolve, 50))
            }

            await Promise.allSettled(messagePromises)

            // System should handle packet loss gracefully
            expect(dropCount).toBeGreaterThan(0) // Some packets should have been dropped
            
            // But core functionality should still work
            const state1 = users[0].chatManager.getState()
            const state2 = users[1].chatManager.getState()
            
            expect(state1.rooms.has(chatRoom.id)).toBe(true)
            expect(state2.rooms.has(chatRoom.id)).toBe(true)
        })
    })

    describe('Concurrent Users and Load Testing', () => {
        it('should handle multiple concurrent users in same chat', async () => {
            const userCount = 10
            const users = await Promise.all(
                Array.from({ length: userCount }, (_, i) =>
                    createUser(`concurrent-user-${i}`, `User ${i}`, 'family', 3001 + i)
                )
            )

            // Create a group chat with all users
            const participantIds = users.map((_, i) => `concurrent-user-${i}`)
            const chatRoom = await users[0].chatManager.createChat(participantIds, {})

            // All users join the chat
            await Promise.all(
                users.slice(1).map(user => user.chatManager.joinChat(chatRoom.id))
            )

            // All users send messages simultaneously
            const startTime = Date.now()
            await Promise.all(
                users.map((user, i) =>
                    user.chatManager.sendMessage(chatRoom.id, `Message from user ${i}`)
                )
            )
            const endTime = Date.now()

            // Should handle concurrent messages efficiently
            expect(endTime - startTime).toBeLessThan(5000)

            // Verify all users have received messages
            users.forEach(user => {
                const state = user.chatManager.getState()
                expect(state.rooms.has(chatRoom.id)).toBe(true)
                expect(state.messages.get(chatRoom.id)?.length).toBeGreaterThan(0)
            })
        })

        it('should handle collaborative editing with many users', async () => {
            const userCount = 8
            const users = await Promise.all(
                Array.from({ length: userCount }, (_, i) =>
                    createUser(`collab-user-${i}`, `Collaborator ${i}`, 'family', 3001 + i)
                )
            )

            // Mock session creation
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'multi-user-session',
                    documentId: 'shared-doc-123',
                    participants: users.map((_, i) => `collab-user-${i}`),
                    version: 1,
                    content: {
                        type: 'funeral_planning',
                        data: { arrangements: [] }
                    },
                    operations: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
            })

            // Create collaborative session
            const session = await users[0].collaborativeManager.createSession('shared-doc-123', {
                type: 'funeral_planning',
                permissions: ['read', 'write']
            })

            // All users join the session
            await Promise.all(
                users.slice(1).map(user => user.collaborativeManager.joinSession(session.id))
            )

            // Each user makes simultaneous edits
            await Promise.all(
                users.map((user, i) =>
                    user.collaborativeManager.applyOperation({
                        id: `op-user-${i}`,
                        type: 'insert',
                        path: ['arrangements', i],
                        value: { type: 'arrangement', description: `Item from user ${i}` },
                        timestamp: new Date().toISOString(),
                        userId: `collab-user-${i}`,
                        sessionId: session.id
                    })
                )
            )

            // Verify all operations were applied
            const state = users[0].collaborativeManager.getState()
            const activeSession = state.activeSessions.get(session.id)!
            
            expect(activeSession.content.data.arrangements).toHaveLength(userCount)
            expect(activeSession.operations).toHaveLength(userCount)
        })

        it('should handle presence tracking for many users', async () => {
            const userCount = 15
            const users = await Promise.all(
                Array.from({ length: userCount }, (_, i) =>
                    createUser(`presence-user-${i}`, `Presence User ${i}`, 'family', 3001 + i)
                )
            )

            // Start presence tracking for all users
            await Promise.all(
                users.map(user => user.presenceManager.startTracking())
            )

            // Simulate presence updates
            await Promise.all(
                users.map(user =>
                    user.presenceManager.updateActivity({
                        type: 'user_interaction',
                        page: '/dashboard',
                        timestamp: new Date().toISOString()
                    })
                )
            )

            // Each user should track others' presence
            users.forEach((user, index) => {
                const state = user.presenceManager.getState()
                expect(state.currentUser?.userId).toBe(`presence-user-${index}`)
                expect(state.currentUser?.status).toBe('online')
            })
        })
    })

    describe('Message Ordering and Consistency', () => {
        it('should maintain message ordering under high load', async () => {
            const family = await createUser('family-ordering', 'Family User', 'family')
            const director = await createUser('director-ordering', 'Director User', 'director', 3002)

            const chatRoom = await family.chatManager.createChat(['family-ordering', 'director-ordering'], {})
            await director.chatManager.joinChat(chatRoom.id)

            const messageCount = 50
            const familyMessages: string[] = []
            const directorMessages: string[] = []

            // Send interleaved messages rapidly
            for (let i = 0; i < messageCount; i++) {
                const message = `Message ${i}`
                if (i % 2 === 0) {
                    familyMessages.push(message)
                    await family.chatManager.sendMessage(chatRoom.id, message)
                } else {
                    directorMessages.push(message)
                    await director.chatManager.sendMessage(chatRoom.id, message)
                }
                
                // Small delay to create timing pressure
                await new Promise(resolve => setTimeout(resolve, 10))
            }

            await new Promise(resolve => setTimeout(resolve, 500))

            // Verify message ordering is preserved
            const familyState = family.chatManager.getState()
            const directorState = director.chatManager.getState()

            const familyReceivedMessages = familyState.messages.get(chatRoom.id) || []
            const directorReceivedMessages = directorState.messages.get(chatRoom.id) || []

            // Both users should have all messages
            expect(familyReceivedMessages.length).toBe(messageCount)
            expect(directorReceivedMessages.length).toBe(messageCount)

            // Messages should be in timestamp order
            for (let i = 1; i < familyReceivedMessages.length; i++) {
                const current = new Date(familyReceivedMessages[i].timestamp)
                const previous = new Date(familyReceivedMessages[i - 1].timestamp)
                expect(current.getTime()).toBeGreaterThanOrEqual(previous.getTime())
            }
        })

        it('should handle clock synchronization issues', async () => {
            const users = await Promise.all([
                createUser('clock-user-1', 'User 1', 'family'),
                createUser('clock-user-2', 'User 2', 'director', 3002)
            ])

            const chatRoom = await users[0].chatManager.createChat(['clock-user-1', 'clock-user-2'], {})
            await users[1].chatManager.joinChat(chatRoom.id)

            // Mock clock skew - second user has clock 5 minutes ahead
            const originalDate = Date.now
            let mockTime = Date.now()

            // User 1 sends message with normal timestamp
            await users[0].chatManager.sendMessage(chatRoom.id, 'Message from past')

            // User 2 sends message with future timestamp (clock skew)
            Date.now = () => mockTime + 5 * 60 * 1000
            await users[1].chatManager.sendMessage(chatRoom.id, 'Message from future')

            // User 1 sends another message with normal timestamp
            Date.now = originalDate
            await users[0].chatManager.sendMessage(chatRoom.id, 'Message from present')

            await new Promise(resolve => setTimeout(resolve, 200))

            // System should handle clock skew gracefully
            const state = users[0].chatManager.getState()
            const messages = state.messages.get(chatRoom.id) || []

            expect(messages.length).toBe(3)
            // Messages should be ordered logically, not just by timestamp
        })

        it('should maintain consistency during network partitions', async () => {
            const users = await Promise.all([
                createUser('partition-user-1', 'User 1', 'family'),
                createUser('partition-user-2', 'User 2', 'director', 3002),
                createUser('partition-user-3', 'User 3', 'venue', 3003)
            ])

            const chatRoom = await users[0].chatManager.createChat(['partition-user-1', 'partition-user-2', 'partition-user-3'], {})
            await Promise.all([
                users[1].chatManager.joinChat(chatRoom.id),
                users[2].chatManager.joinChat(chatRoom.id)
            ])

            // All users send initial messages
            await Promise.all([
                users[0].chatManager.sendMessage(chatRoom.id, 'Message from user 1'),
                users[1].chatManager.sendMessage(chatRoom.id, 'Message from user 2'),
                users[2].chatManager.sendMessage(chatRoom.id, 'Message from user 3')
            ])

            // Simulate network partition - disconnect user 2
            users[1].server.close()

            // Users 1 and 3 continue messaging
            await users[0].chatManager.sendMessage(chatRoom.id, 'Message while user 2 offline')
            await users[2].chatManager.sendMessage(chatRoom.id, 'Another message while user 2 offline')

            // User 2 reconnects
            users[1].server = new WS('ws://localhost:3002')
            await users[1].client.connect()
            await users[1].server.connected

            // Send message after reconnection
            await users[1].chatManager.sendMessage(chatRoom.id, 'Message after reconnection')

            await new Promise(resolve => setTimeout(resolve, 300))

            // All users should eventually have consistent state
            const states = users.map(user => user.chatManager.getState())
            const messageCounts = states.map(state => state.messages.get(chatRoom.id)?.length || 0)

            // All users should have similar message counts (allowing for some variance)
            const maxCount = Math.max(...messageCounts)
            const minCount = Math.min(...messageCounts)
            expect(maxCount - minCount).toBeLessThanOrEqual(1)
        })
    })

    describe('System Limits and Edge Cases', () => {
        it('should handle rate limiting gracefully', async () => {
            const user = await createUser('rate-limit-user', 'Rate Limit User', 'family')
            const chatRoom = await user.chatManager.createChat(['rate-limit-user'], {})

            // Try to send messages faster than rate limit
            const promises = []
            for (let i = 0; i < RATE_LIMITS.MESSAGES_PER_MINUTE + 10; i++) {
                promises.push(
                    user.chatManager.sendMessage(chatRoom.id, `Rate limit test ${i}`)
                        .catch(error => error)
                )
            }

            const results = await Promise.allSettled(promises)
            
            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            // Should enforce rate limits
            expect(successful).toBeLessThanOrEqual(RATE_LIMITS.MESSAGES_PER_MINUTE)
            expect(failed).toBeGreaterThan(0)
        })

        it('should handle large message payloads', async () => {
            const user = await createUser('large-payload-user', 'Large Payload User', 'family')
            const chatRoom = await user.chatManager.createChat(['large-payload-user'], {})

            // Test with maximum allowed message size
            const maxContent = 'a'.repeat(2000) // Maximum message length
            
            await expect(
                user.chatManager.sendMessage(chatRoom.id, maxContent)
            ).resolves.toBeDefined()

            // Test with oversized message
            const oversizedContent = 'a'.repeat(2001)
            
            await expect(
                user.chatManager.sendMessage(chatRoom.id, oversizedContent)
            ).rejects.toThrow('Message too long')
        })

        it('should handle memory pressure scenarios', async () => {
            const user = await createUser('memory-pressure-user', 'Memory Pressure User', 'family')
            
            // Create many chat rooms
            const roomPromises = []
            for (let i = 0; i < 100; i++) {
                roomPromises.push(
                    user.chatManager.createChat([`memory-pressure-user`], { roomId: `room-${i}` })
                        .catch(() => null) // Some may fail due to limits
                )
            }

            const rooms = await Promise.all(roomPromises)
            const successfulRooms = rooms.filter(room => room !== null)

            // System should handle many rooms but may limit to prevent memory issues
            expect(successfulRooms.length).toBeGreaterThan(0)
            expect(successfulRooms.length).toBeLessThanOrEqual(100)

            // Send messages to multiple rooms
            const messagePromises = successfulRooms.slice(0, 10).map(room =>
                user.chatManager.sendMessage(room.id, 'Memory pressure test message')
                    .catch(() => null)
            )

            const messageResults = await Promise.all(messagePromises)
            expect(messageResults.filter(r => r !== null).length).toBeGreaterThan(0)
        })
    })

    describe('Error Recovery and Fault Tolerance', () => {
        it('should recover from complete connection failure', async () => {
            const user = await createUser('recovery-user', 'Recovery User', 'family')
            const chatRoom = await user.chatManager.createChat(['recovery-user'], {})

            // Send initial message
            await user.chatManager.sendMessage(chatRoom.id, 'Before failure')

            // Simulate complete connection failure
            user.server.close()
            user.client.disconnect()

            // Try to send message while disconnected (should queue)
            const queuedMessagePromise = user.chatManager.sendMessage(chatRoom.id, 'Queued message')

            // Reconnect
            user.server = new WS('ws://localhost:3001')
            await user.client.connect()
            await user.server.connected

            // Queued message should be sent
            await queuedMessagePromise

            // Send message after recovery
            await user.chatManager.sendMessage(chatRoom.id, 'After recovery')

            const state = user.chatManager.getState()
            const messages = state.messages.get(chatRoom.id) || []
            
            expect(messages.length).toBe(3)
            expect(messages.map(m => m.content)).toEqual([
                'Before failure',
                'Queued message',
                'After recovery'
            ])
        })

        it('should handle corrupted data gracefully', async () => {
            const user = await createUser('corruption-user', 'Corruption User', 'family')

            // Send various corrupted messages
            const corruptedMessages = [
                'invalid json {',
                '{"incomplete": ',
                'null',
                '',
                '{"type": "unknown", "data": null}',
                '{"type": "' + 'x'.repeat(10000) + '"}'
            ]

            for (const corrupt of corruptedMessages) {
                user.server.send(corrupt)
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            // System should remain stable despite corruption
            expect(user.client.getConnectionStatus()).toBe('connected')
        })

        it('should handle server restart scenarios', async () => {
            const user = await createUser('restart-user', 'Restart User', 'family')
            const chatRoom = await user.chatManager.createChat(['restart-user'], {})

            await user.chatManager.sendMessage(chatRoom.id, 'Before restart')

            // Simulate server restart
            user.server.close()
            await new Promise(resolve => setTimeout(resolve, 100))

            // Create new server (simulating restart)
            user.server = new WS('ws://localhost:3001')
            
            // Client should reconnect automatically
            await user.server.connected

            await user.chatManager.sendMessage(chatRoom.id, 'After restart')

            const state = user.chatManager.getState()
            expect(state.rooms.has(chatRoom.id)).toBe(true)
        })
    })
})