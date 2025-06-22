/**
 * PRESENCE TRACKING TESTS - COMPREHENSIVE REAL-TIME PRESENCE TESTING
 * 
 * Purpose: Test user presence tracking, online/offline detection, activity monitoring
 * Features: Presence states, idle detection, activity tracking, user status
 * Test Scenarios: Connection states, idle timeout, activity updates, multi-device
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { PresenceManager, PresenceState, UserActivity } from '@/lib/realtime/presence'
import { UserPresence, PresenceStatus } from '@/lib/realtime/types'
import { EVENTS, CHANNELS } from '@/lib/realtime/config'

// Mock browser APIs
Object.defineProperty(document, 'hidden', {
    writable: true,
    value: false
})

Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'visible'
})

global.addEventListener = vi.fn()
global.removeEventListener = vi.fn()

describe('Presence Tracking Tests', () => {
    let server: WS
    let client: RealtimeClient
    let presenceManager: PresenceManager
    let mockVisibilityState: string

    beforeAll(() => {
        // Mock visibility API
        Object.defineProperty(document, 'visibilityState', {
            get: () => mockVisibilityState,
            configurable: true
        })
    })

    beforeEach(() => {
        server = new WS('ws://localhost:3001')
        
        client = new RealtimeClient({
            userId: 'user-123',
            userName: 'Test User',
            userRole: 'family',
            sessionId: 'session-123',
            provider: 'websocket'
        })

        presenceManager = new PresenceManager(client)
        mockVisibilityState = 'visible'

        // Reset mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        if (client) {
            client.disconnect()
        }
        if (presenceManager) {
            presenceManager.destroy()
        }
        WS.clean()
    })

    describe('Presence State Management', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should initialize with correct presence state', async () => {
            await presenceManager.startTracking()

            const state = presenceManager.getState()
            expect(state.currentUser).toBeDefined()
            expect(state.currentUser?.userId).toBe('user-123')
            expect(state.currentUser?.status).toBe('online')
            expect(state.currentUser?.lastSeen).toBeDefined()
        })

        it('should update presence when user becomes active', async () => {
            await presenceManager.startTracking()

            const activityData: UserActivity = {
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date().toISOString(),
                metadata: {
                    action: 'click',
                    element: 'chat-button'
                }
            }

            await presenceManager.updateActivity(activityData)

            const state = presenceManager.getState()
            expect(state.currentUser?.currentPage).toBe('/dashboard')
            expect(state.currentUser?.lastActivity).toBeDefined()
            expect(state.currentUser?.status).toBe('online')
        })

        it('should detect idle state after inactivity', async () => {
            await presenceManager.startTracking()

            // Mock idle timeout
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(Date.now())
                .mockReturnValueOnce(Date.now() + 11 * 60 * 1000) // 11 minutes later

            // Trigger idle check
            await presenceManager['checkIdleState']()

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('idle')
        })

        it('should handle visibility changes', async () => {
            await presenceManager.startTracking()

            // Simulate tab becoming hidden
            mockVisibilityState = 'hidden'
            document.dispatchEvent(new Event('visibilitychange'))

            await new Promise(resolve => setTimeout(resolve, 100))

            let state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('away')

            // Simulate tab becoming visible again
            mockVisibilityState = 'visible'
            document.dispatchEvent(new Event('visibilitychange'))

            await new Promise(resolve => setTimeout(resolve, 100))

            state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('online')
        })

        it('should handle offline/online detection', async () => {
            await presenceManager.startTracking()

            // Simulate going offline
            global.navigator.onLine = false
            window.dispatchEvent(new Event('offline'))

            await new Promise(resolve => setTimeout(resolve, 100))

            let state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('offline')

            // Simulate coming back online
            global.navigator.onLine = true
            window.dispatchEvent(new Event('online'))

            await new Promise(resolve => setTimeout(resolve, 100))

            state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('online')
        })
    })

    describe('Multi-User Presence', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should track other users presence', async () => {
            const otherUserPresence: UserPresence = {
                userId: 'other-user-456',
                userName: 'Other User',
                userRole: 'director',
                status: 'online',
                lastSeen: new Date().toISOString(),
                currentPage: '/director/dashboard',
                lastActivity: new Date().toISOString()
            }

            // Simulate receiving presence update from server
            server.send(JSON.stringify({
                type: EVENTS.USER_ONLINE,
                data: otherUserPresence
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            expect(state.users.has('other-user-456')).toBe(true)
            expect(state.users.get('other-user-456')).toEqual(otherUserPresence)
        })

        it('should handle user going offline', async () => {
            // First, add user as online
            const userPresence: UserPresence = {
                userId: 'temp-user-789',
                userName: 'Temp User',
                userRole: 'family',
                status: 'online',
                lastSeen: new Date().toISOString()
            }

            server.send(JSON.stringify({
                type: EVENTS.USER_ONLINE,
                data: userPresence
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            // Then simulate user going offline
            server.send(JSON.stringify({
                type: EVENTS.USER_OFFLINE,
                data: {
                    ...userPresence,
                    status: 'offline',
                    lastSeen: new Date().toISOString()
                }
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            const user = state.users.get('temp-user-789')
            expect(user?.status).toBe('offline')
        })

        it('should maintain presence for multiple users', async () => {
            const users = [
                {
                    userId: 'user-1',
                    userName: 'User 1',
                    userRole: 'family',
                    status: 'online'
                },
                {
                    userId: 'user-2',
                    userName: 'User 2',
                    userRole: 'director',
                    status: 'idle'
                },
                {
                    userId: 'user-3',
                    userName: 'User 3',
                    userRole: 'venue',
                    status: 'away'
                }
            ]

            // Send presence updates for all users
            for (const user of users) {
                server.send(JSON.stringify({
                    type: EVENTS.USER_ONLINE,
                    data: {
                        ...user,
                        lastSeen: new Date().toISOString()
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            expect(state.users.size).toBe(3)
            
            users.forEach(user => {
                expect(state.users.has(user.userId)).toBe(true)
                expect(state.users.get(user.userId)?.status).toBe(user.status)
            })
        })
    })

    describe('Activity Tracking', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should track page navigation', async () => {
            const pageActivity: UserActivity = {
                type: 'page_navigation',
                page: '/family/chat',
                timestamp: new Date().toISOString(),
                metadata: {
                    previousPage: '/family/dashboard',
                    referrer: 'internal'
                }
            }

            await presenceManager.updateActivity(pageActivity)

            const state = presenceManager.getState()
            expect(state.currentUser?.currentPage).toBe('/family/chat')
            expect(state.currentUser?.lastActivity).toBeDefined()
        })

        it('should track user interactions', async () => {
            const interactions = [
                { type: 'click', element: 'send-message-button' },
                { type: 'scroll', element: 'message-list' },
                { type: 'focus', element: 'message-input' }
            ]

            for (const interaction of interactions) {
                await presenceManager.updateActivity({
                    type: 'user_interaction',
                    page: '/family/chat',
                    timestamp: new Date().toISOString(),
                    metadata: interaction
                })
            }

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('online')
            expect(state.currentUser?.lastActivity).toBeDefined()
        })

        it('should handle rapid activity updates efficiently', async () => {
            const startTime = Date.now()
            
            // Generate many activity updates
            const activities = Array.from({ length: 100 }, (_, i) => ({
                type: 'user_interaction',
                page: '/family/chat',
                timestamp: new Date().toISOString(),
                metadata: {
                    action: 'typing',
                    sequence: i
                }
            }))

            for (const activity of activities) {
                await presenceManager.updateActivity(activity)
            }

            const endTime = Date.now()
            
            // Should handle many updates efficiently
            expect(endTime - startTime).toBeLessThan(1000)
            
            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('online')
        })
    })

    describe('Typing Indicators', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should track typing in chat', async () => {
            const chatId = 'chat-123'
            
            await presenceManager.startTypingInChat(chatId)

            const state = presenceManager.getState()
            expect(state.typing.has(chatId)).toBe(true)
            expect(state.typing.get(chatId)?.isTyping).toBe(true)
            expect(state.typing.get(chatId)?.userId).toBe('user-123')
        })

        it('should stop typing after timeout', async () => {
            const chatId = 'chat-123'
            
            await presenceManager.startTypingInChat(chatId)
            
            // Wait for typing timeout (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 5100))

            const state = presenceManager.getState()
            expect(state.typing.get(chatId)?.isTyping).toBe(false)
        })

        it('should handle multiple users typing', async () => {
            const chatId = 'chat-123'
            
            // Start typing for current user
            await presenceManager.startTypingInChat(chatId)

            // Simulate other user typing
            server.send(JSON.stringify({
                type: EVENTS.MESSAGE_TYPING,
                data: {
                    chatId,
                    userId: 'other-user-456',
                    userName: 'Other User',
                    isTyping: true
                }
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            expect(state.typing.get(chatId)?.isTyping).toBe(true)
            expect(state.otherUsersTyping.get(chatId)?.size).toBe(1)
            expect(state.otherUsersTyping.get(chatId)?.has('other-user-456')).toBe(true)
        })
    })

    describe('Presence in Rooms/Channels', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should join presence channel', async () => {
            const channelId = 'family-planning-123'
            
            await presenceManager.joinChannel(channelId)

            const state = presenceManager.getState()
            expect(state.channels.has(channelId)).toBe(true)
            expect(state.channels.get(channelId)?.members.has('user-123')).toBe(true)
        })

        it('should leave presence channel', async () => {
            const channelId = 'family-planning-123'
            
            await presenceManager.joinChannel(channelId)
            await presenceManager.leaveChannel(channelId)

            const state = presenceManager.getState()
            expect(state.channels.has(channelId)).toBe(false)
        })

        it('should track channel members', async () => {
            const channelId = 'family-planning-123'
            
            await presenceManager.joinChannel(channelId)

            // Simulate other users joining
            const otherUsers = [
                { userId: 'director-456', userName: 'Director', userRole: 'director' },
                { userId: 'venue-789', userName: 'Venue', userRole: 'venue' }
            ]

            for (const user of otherUsers) {
                server.send(JSON.stringify({
                    type: 'presence:channel:joined',
                    data: {
                        channelId,
                        user: {
                            ...user,
                            status: 'online',
                            lastSeen: new Date().toISOString()
                        }
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            const channel = state.channels.get(channelId)
            expect(channel?.members.size).toBe(3) // Including current user
            expect(channel?.members.has('director-456')).toBe(true)
            expect(channel?.members.has('venue-789')).toBe(true)
        })
    })

    describe('Idle Detection', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should detect idle state after inactivity period', async () => {
            // Mock time progression
            let currentTime = Date.now()
            vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

            // Initial activity
            await presenceManager.updateActivity({
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date(currentTime).toISOString()
            })

            // Fast forward time by 11 minutes (idle threshold is 10 minutes)
            currentTime += 11 * 60 * 1000

            // Trigger idle check
            await presenceManager['checkIdleState']()

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('idle')
        })

        it('should return to online from idle when activity resumes', async () => {
            // First become idle
            let currentTime = Date.now()
            vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

            await presenceManager.updateActivity({
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date(currentTime).toISOString()
            })

            currentTime += 11 * 60 * 1000
            await presenceManager['checkIdleState']()

            expect(presenceManager.getState().currentUser?.status).toBe('idle')

            // Then resume activity
            currentTime += 1000
            await presenceManager.updateActivity({
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date(currentTime).toISOString()
            })

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('online')
        })

        it('should handle custom idle timeout', async () => {
            const customTimeout = 5 * 60 * 1000 // 5 minutes
            await presenceManager.setIdleTimeout(customTimeout)

            let currentTime = Date.now()
            vi.spyOn(Date, 'now').mockImplementation(() => currentTime)

            await presenceManager.updateActivity({
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date(currentTime).toISOString()
            })

            // Fast forward by 6 minutes
            currentTime += 6 * 60 * 1000
            await presenceManager['checkIdleState']()

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('idle')
        })
    })

    describe('Multi-Device Presence', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()
        })

        it('should handle presence from multiple devices', async () => {
            const devices = [
                { deviceId: 'device-1', type: 'desktop', status: 'online' },
                { deviceId: 'device-2', type: 'mobile', status: 'online' },
                { deviceId: 'device-3', type: 'tablet', status: 'idle' }
            ]

            for (const device of devices) {
                server.send(JSON.stringify({
                    type: 'presence:device:update',
                    data: {
                        userId: 'user-123',
                        device,
                        timestamp: new Date().toISOString()
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            expect(state.currentUser?.devices?.length).toBe(3)
            
            // Overall status should be the most active device status
            expect(state.currentUser?.status).toBe('online')
        })

        it('should update overall status based on most active device', async () => {
            // All devices go idle
            const devices = [
                { deviceId: 'device-1', type: 'desktop', status: 'idle' },
                { deviceId: 'device-2', type: 'mobile', status: 'idle' }
            ]

            for (const device of devices) {
                server.send(JSON.stringify({
                    type: 'presence:device:update',
                    data: {
                        userId: 'user-123',
                        device,
                        timestamp: new Date().toISOString()
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('idle')
        })
    })

    describe('Error Handling and Edge Cases', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should handle presence updates when disconnected', async () => {
            await presenceManager.startTracking()
            
            // Disconnect
            client.disconnect()

            // Try to update presence
            await presenceManager.updateActivity({
                type: 'user_interaction',
                page: '/dashboard',
                timestamp: new Date().toISOString()
            })

            // Should not crash and should queue the update
            const state = presenceManager.getState()
            expect(state.currentUser?.status).toBe('offline')
        })

        it('should handle malformed presence data', async () => {
            await presenceManager.startTracking()

            // Send invalid presence data
            server.send('invalid json')
            server.send(JSON.stringify({ invalid: 'data' }))
            server.send(JSON.stringify({
                type: EVENTS.USER_ONLINE,
                data: null
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            // Should not crash
            const state = presenceManager.getState()
            expect(state.currentUser).toBeDefined()
        })

        it('should clean up old presence data', async () => {
            await presenceManager.startTracking()

            // Add many old presence entries
            const oldTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            
            for (let i = 0; i < 100; i++) {
                server.send(JSON.stringify({
                    type: EVENTS.USER_ONLINE,
                    data: {
                        userId: `old-user-${i}`,
                        userName: `Old User ${i}`,
                        userRole: 'family',
                        status: 'offline',
                        lastSeen: oldTimestamp
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            // Trigger cleanup
            await presenceManager.cleanupOldPresence()

            const state = presenceManager.getState()
            
            // Should have cleaned up old entries
            expect(state.users.size).toBeLessThan(100)
        })
    })

    describe('Performance and Memory Management', () => {
        it('should handle large number of users efficiently', async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()

            const startTime = Date.now()
            
            // Simulate many users
            for (let i = 0; i < 1000; i++) {
                server.send(JSON.stringify({
                    type: EVENTS.USER_ONLINE,
                    data: {
                        userId: `user-${i}`,
                        userName: `User ${i}`,
                        userRole: 'family',
                        status: 'online',
                        lastSeen: new Date().toISOString()
                    }
                }))
            }

            await new Promise(resolve => setTimeout(resolve, 100))

            const endTime = Date.now()
            
            // Should handle efficiently
            expect(endTime - startTime).toBeLessThan(2000)
            
            const state = presenceManager.getState()
            expect(state.users.size).toBe(1000)
        })

        it('should manage memory usage with presence data', async () => {
            await client.connect()
            await server.connected
            await presenceManager.startTracking()

            const initialMemory = process.memoryUsage().heapUsed

            // Add and remove many presence entries
            for (let cycle = 0; cycle < 10; cycle++) {
                // Add users
                for (let i = 0; i < 100; i++) {
                    server.send(JSON.stringify({
                        type: EVENTS.USER_ONLINE,
                        data: {
                            userId: `cycle-${cycle}-user-${i}`,
                            userName: `User ${i}`,
                            userRole: 'family',
                            status: 'online',
                            lastSeen: new Date().toISOString()
                        }
                    }))
                }

                // Remove users
                for (let i = 0; i < 100; i++) {
                    server.send(JSON.stringify({
                        type: EVENTS.USER_OFFLINE,
                        data: {
                            userId: `cycle-${cycle}-user-${i}`,
                            status: 'offline',
                            lastSeen: new Date().toISOString()
                        }
                    }))
                }

                await new Promise(resolve => setTimeout(resolve, 10))
            }

            const finalMemory = process.memoryUsage().heapUsed
            const memoryIncrease = finalMemory - initialMemory

            // Memory increase should be reasonable
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
        })
    })
})