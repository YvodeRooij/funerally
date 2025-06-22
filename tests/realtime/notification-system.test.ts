/**
 * NOTIFICATION SYSTEM TESTS - COMPREHENSIVE REAL-TIME NOTIFICATION TESTING
 * 
 * Purpose: Test notification delivery, priority handling, multi-channel support
 * Features: Push notifications, email, SMS, in-app notifications, user preferences
 * Test Scenarios: Delivery guarantees, failover, batching, rate limiting
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { NotificationManager, NotificationChannel, NotificationPreferences } from '@/lib/realtime/notifications'
import { Notification, NotificationPriority, NotificationType } from '@/lib/realtime/types'
import { EVENTS, CHANNELS, RATE_LIMITS } from '@/lib/realtime/config'

// Mock fetch and other APIs
global.fetch = vi.fn()
global.Notification = vi.fn() as any
global.navigator = {
    serviceWorker: {
        ready: Promise.resolve({
            showNotification: vi.fn()
        } as any)
    }
} as any

describe('Notification System Tests', () => {
    let server: WS
    let client: RealtimeClient
    let notificationManager: NotificationManager
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

        notificationManager = new NotificationManager(client)

        // Reset mocks
        mockFetch.mockReset()
        vi.clearAllMocks()
    })

    afterEach(() => {
        if (client) {
            client.disconnect()
        }
        if (notificationManager) {
            notificationManager.destroy()
        }
        WS.clean()
    })

    describe('Notification Delivery', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should send in-app notifications', async () => {
            const notification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'New Message',
                body: 'You have received a new message from your funeral director',
                type: 'chat_message',
                priority: 'normal',
                data: {
                    chatId: 'chat-123',
                    messageId: 'msg-456'
                },
                read: false
            }

            const sendPromise = notificationManager.send(notification)

            // Simulate server acknowledgment
            server.send(JSON.stringify({
                type: EVENTS.NOTIFICATION_NEW,
                data: {
                    ...notification,
                    id: 'notif-123',
                    timestamp: new Date().toISOString()
                }
            }))

            const notificationId = await sendPromise
            expect(notificationId).toBeDefined()

            const state = notificationManager.getState()
            expect(state.items).toHaveLength(1)
            expect(state.items[0].title).toBe(notification.title)
            expect(state.unreadCount).toBe(1)
        })

        it('should handle notification priorities correctly', async () => {
            const notifications = [
                {
                    title: 'Low Priority',
                    body: 'This is a low priority notification',
                    priority: 'low' as NotificationPriority,
                    type: 'system_update' as NotificationType
                },
                {
                    title: 'High Priority',
                    body: 'This is urgent!',
                    priority: 'high' as NotificationPriority,
                    type: 'urgent_update' as NotificationType
                },
                {
                    title: 'Critical Priority',
                    body: 'Critical system alert!',
                    priority: 'critical' as NotificationPriority,
                    type: 'system_alert' as NotificationType
                }
            ]

            const sendPromises = notifications.map(notif => 
                notificationManager.send({
                    userId: 'family-user-123',
                    ...notif,
                    data: {},
                    read: false
                })
            )

            await Promise.all(sendPromises)

            const state = notificationManager.getState()
            
            // Critical and high priority should be at the top
            expect(state.items[0].priority).toBe('critical')
            expect(state.items[1].priority).toBe('high')
            expect(state.items[2].priority).toBe('low')
        })

        it('should respect rate limiting', async () => {
            const promises = []
            
            // Try to send more notifications than rate limit allows
            for (let i = 0; i < RATE_LIMITS.NOTIFICATIONS_PER_MINUTE + 10; i++) {
                promises.push(
                    notificationManager.send({
                        userId: 'family-user-123',
                        title: `Notification ${i}`,
                        body: `Body ${i}`,
                        type: 'system_update',
                        priority: 'normal',
                        data: {},
                        read: false
                    })
                )
            }

            const results = await Promise.allSettled(promises)
            
            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            expect(successful).toBe(RATE_LIMITS.NOTIFICATIONS_PER_MINUTE)
            expect(failed).toBe(10)
        })

        it('should handle notification delivery failures gracefully', async () => {
            // Simulate server error
            server.close()

            const notification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'Test Notification',
                body: 'This should fail',
                type: 'system_update',
                priority: 'normal',
                data: {},
                read: false
            }

            try {
                await notificationManager.send(notification)
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.code).toBe('NOTIFICATION_DELIVERY_FAILED')
                expect(error.recoverable).toBe(true)
            }
        })
    })

    describe('Multi-Channel Delivery', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should deliver notifications via multiple channels', async () => {
            const preferences: NotificationPreferences = {
                userId: 'family-user-123',
                inApp: true,
                push: true,
                email: true,
                sms: false,
                channels: {
                    chat_message: ['inApp', 'push'],
                    document_shared: ['inApp', 'email'],
                    urgent_update: ['inApp', 'push', 'email', 'sms']
                }
            }

            await notificationManager.updatePreferences(preferences)

            mockFetch.mockResolvedValue({ ok: true })

            const urgentNotification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'Urgent Update',
                body: 'Please contact us immediately',
                type: 'urgent_update',
                priority: 'critical',
                data: {},
                read: false
            }

            await notificationManager.send(urgentNotification)

            // Should trigger multiple delivery channels
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/push', expect.any(Object))
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/email', expect.any(Object))
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/sms', expect.any(Object))
        })

        it('should handle push notification permissions', async () => {
            // Mock push notification API
            global.Notification.permission = 'granted'
            global.Notification.requestPermission = vi.fn().mockResolvedValue('granted')

            const hasPermission = await notificationManager.requestPushPermission()
            expect(hasPermission).toBe(true)

            // Mock permission denied
            global.Notification.permission = 'denied'
            global.Notification.requestPermission = vi.fn().mockResolvedValue('denied')

            const hasPermissionDenied = await notificationManager.requestPushPermission()
            expect(hasPermissionDenied).toBe(false)
        })

        it('should fallback when channels are unavailable', async () => {
            const preferences: NotificationPreferences = {
                userId: 'family-user-123',
                inApp: true,
                push: true,
                email: true,
                sms: true,
                channels: {
                    urgent_update: ['push', 'email', 'sms']
                }
            }

            await notificationManager.updatePreferences(preferences)

            // Mock push notification failure
            global.Notification.permission = 'denied'
            
            // Mock email service failure
            mockFetch.mockImplementation((url) => {
                if (url.includes('/email')) {
                    return Promise.resolve({ ok: false, status: 503 })
                }
                return Promise.resolve({ ok: true })
            })

            const notification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'Urgent Update',
                body: 'Critical message',
                type: 'urgent_update',
                priority: 'critical',
                data: {},
                read: false
            }

            await notificationManager.send(notification)

            // Should fallback to SMS since push and email failed
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/sms', expect.any(Object))
        })
    })

    describe('Notification Preferences', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should update user notification preferences', async () => {
            const preferences: NotificationPreferences = {
                userId: 'family-user-123',
                inApp: true,
                push: false,
                email: true,
                sms: false,
                channels: {
                    chat_message: ['inApp'],
                    document_shared: ['inApp', 'email'],
                    booking_reminder: ['email']
                },
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '08:00',
                    timezone: 'Europe/Amsterdam'
                }
            }

            mockFetch.mockResolvedValue({ ok: true })

            await notificationManager.updatePreferences(preferences)

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify(preferences)
            })

            const currentPrefs = notificationManager.getPreferences()
            expect(currentPrefs).toEqual(preferences)
        })

        it('should respect quiet hours', async () => {
            const preferences: NotificationPreferences = {
                userId: 'family-user-123',
                inApp: true,
                push: true,
                email: true,
                sms: true,
                channels: {},
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '08:00',
                    timezone: 'Europe/Amsterdam'
                }
            }

            await notificationManager.updatePreferences(preferences)

            // Mock current time to be during quiet hours (23:00)
            const mockDate = new Date('2023-01-01T23:00:00+01:00')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

            const notification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'Non-urgent notification',
                body: 'Can wait until morning',
                type: 'system_update',
                priority: 'normal',
                data: {},
                read: false
            }

            await notificationManager.send(notification)

            // Should only send in-app notification during quiet hours
            expect(mockFetch).not.toHaveBeenCalledWith('/api/notifications/push', expect.any(Object))
            expect(mockFetch).not.toHaveBeenCalledWith('/api/notifications/sms', expect.any(Object))
        })

        it('should ignore quiet hours for critical notifications', async () => {
            const preferences: NotificationPreferences = {
                userId: 'family-user-123',
                inApp: true,
                push: true,
                email: true,
                sms: true,
                channels: {},
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '08:00',
                    timezone: 'Europe/Amsterdam'
                }
            }

            await notificationManager.updatePreferences(preferences)

            // Mock current time to be during quiet hours
            const mockDate = new Date('2023-01-01T23:00:00+01:00')
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate)

            mockFetch.mockResolvedValue({ ok: true })

            const criticalNotification: Omit<Notification, 'id' | 'timestamp'> = {
                userId: 'family-user-123',
                title: 'Critical Alert',
                body: 'Immediate attention required',
                type: 'urgent_update',
                priority: 'critical',
                data: {},
                read: false
            }

            await notificationManager.send(criticalNotification)

            // Critical notifications should bypass quiet hours
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/push', expect.any(Object))
            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/sms', expect.any(Object))
        })
    })

    describe('Notification Batching', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should batch similar notifications', async () => {
            const chatId = 'chat-123'
            const notifications = Array.from({ length: 5 }, (_, i) => ({
                userId: 'family-user-123',
                title: 'New Message',
                body: `Message ${i + 1}`,
                type: 'chat_message' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: { chatId, messageId: `msg-${i}` },
                read: false
            }))

            // Enable batching
            await notificationManager.setBatchingEnabled(true, 2000) // 2 second window

            const sendPromises = notifications.map(notif => 
                notificationManager.send(notif)
            )

            await Promise.all(sendPromises)

            // Wait for batching window
            await new Promise(resolve => setTimeout(resolve, 2100))

            const state = notificationManager.getState()
            
            // Should have batched into fewer notifications
            expect(state.items.length).toBeLessThan(5)
            
            // Batched notification should mention multiple messages
            const batchedNotification = state.items.find(n => 
                n.body.includes('5 new messages') || n.title.includes('5')
            )
            expect(batchedNotification).toBeDefined()
        })

        it('should not batch notifications of different types', async () => {
            const notifications = [
                {
                    userId: 'family-user-123',
                    title: 'New Message',
                    body: 'Chat message',
                    type: 'chat_message' as NotificationType,
                    priority: 'normal' as NotificationPriority,
                    data: {},
                    read: false
                },
                {
                    userId: 'family-user-123',
                    title: 'Document Shared',
                    body: 'New document available',
                    type: 'document_shared' as NotificationType,
                    priority: 'normal' as NotificationPriority,
                    data: {},
                    read: false
                }
            ]

            await notificationManager.setBatchingEnabled(true, 1000)

            await Promise.all(notifications.map(notif => 
                notificationManager.send(notif)
            ))

            await new Promise(resolve => setTimeout(resolve, 1100))

            const state = notificationManager.getState()
            
            // Should not batch different types
            expect(state.items).toHaveLength(2)
        })
    })

    describe('Notification History and Management', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should mark notifications as read', async () => {
            const notification = {
                userId: 'family-user-123',
                title: 'Test Notification',
                body: 'Test body',
                type: 'system_update' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: {},
                read: false
            }

            const notificationId = await notificationManager.send(notification)
            
            mockFetch.mockResolvedValue({ ok: true })
            
            await notificationManager.markAsRead(notificationId)

            const state = notificationManager.getState()
            const readNotification = state.items.find(n => n.id === notificationId)
            
            expect(readNotification?.read).toBe(true)
            expect(state.unreadCount).toBe(0)
        })

        it('should clear all notifications', async () => {
            // Send multiple notifications
            const notifications = Array.from({ length: 3 }, (_, i) => ({
                userId: 'family-user-123',
                title: `Notification ${i}`,
                body: `Body ${i}`,
                type: 'system_update' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: {},
                read: false
            }))

            await Promise.all(notifications.map(notif => 
                notificationManager.send(notif)
            ))

            mockFetch.mockResolvedValue({ ok: true })

            await notificationManager.clearAll()

            const state = notificationManager.getState()
            expect(state.items).toHaveLength(0)
            expect(state.unreadCount).toBe(0)
        })

        it('should load notification history', async () => {
            const mockHistory = Array.from({ length: 10 }, (_, i) => ({
                id: `notif-${i}`,
                userId: 'family-user-123',
                title: `Historic Notification ${i}`,
                body: `Body ${i}`,
                type: 'system_update' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: {},
                read: i < 5,
                timestamp: new Date(Date.now() - i * 3600000).toISOString()
            }))

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHistory)
            })

            await notificationManager.loadHistory(10)

            const state = notificationManager.getState()
            expect(state.items).toHaveLength(10)
            expect(state.unreadCount).toBe(5)
        })
    })

    describe('Error Handling and Resilience', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should retry failed notification deliveries', async () => {
            let attemptCount = 0
            mockFetch.mockImplementation(() => {
                attemptCount++
                if (attemptCount < 3) {
                    return Promise.resolve({ ok: false, status: 503 })
                }
                return Promise.resolve({ ok: true })
            })

            const notification = {
                userId: 'family-user-123',
                title: 'Retry Test',
                body: 'Should retry on failure',
                type: 'system_update' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: {},
                read: false
            }

            await notificationManager.send(notification)

            // Should have retried and eventually succeeded
            expect(attemptCount).toBe(3)
        })

        it('should handle malformed notification data', async () => {
            server.send('invalid json')
            server.send(JSON.stringify({ invalid: 'notification' }))
            server.send(JSON.stringify({
                type: EVENTS.NOTIFICATION_NEW,
                data: null
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            // Should not crash and maintain stable state
            const state = notificationManager.getState()
            expect(state.items).toHaveLength(0)
        })

        it('should handle notification overflow', async () => {
            // Send more notifications than memory limit
            const notifications = Array.from({ length: 1000 }, (_, i) => ({
                userId: 'family-user-123',
                title: `Notification ${i}`,
                body: `Body ${i}`,
                type: 'system_update' as NotificationType,
                priority: 'normal' as NotificationPriority,
                data: {},
                read: false
            }))

            await Promise.all(notifications.map(notif => 
                notificationManager.send(notif)
            ))

            const state = notificationManager.getState()
            
            // Should limit in-memory notifications
            expect(state.items.length).toBeLessThanOrEqual(100)
        })
    })

    describe('Performance and Scalability', () => {
        it('should handle high notification volume efficiently', async () => {
            await client.connect()
            await server.connected

            const startTime = Date.now()
            
            // Send many notifications rapidly
            const promises = Array.from({ length: 100 }, (_, i) =>
                notificationManager.send({
                    userId: 'family-user-123',
                    title: `Notification ${i}`,
                    body: `Body ${i}`,
                    type: 'system_update',
                    priority: 'normal',
                    data: {},
                    read: false
                })
            )

            await Promise.all(promises)
            const endTime = Date.now()

            // Should handle volume efficiently
            expect(endTime - startTime).toBeLessThan(2000)
        })

        it('should efficiently manage memory with large notification history', async () => {
            await client.connect()
            await server.connected

            // Simulate large notification history
            const startMemory = process.memoryUsage().heapUsed

            for (let i = 0; i < 10000; i++) {
                await notificationManager.send({
                    userId: 'family-user-123',
                    title: `Notification ${i}`,
                    body: `Body ${i}`,
                    type: 'system_update',
                    priority: 'normal',
                    data: {},
                    read: false
                })

                // Periodically clean up old notifications
                if (i % 100 === 0) {
                    await notificationManager.cleanupOldNotifications(100)
                }
            }

            const endMemory = process.memoryUsage().heapUsed
            const memoryIncrease = endMemory - startMemory

            // Memory increase should be reasonable
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
        })
    })
})