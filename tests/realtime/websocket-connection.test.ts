/**
 * WEBSOCKET CONNECTION TESTS - COMPREHENSIVE REAL-TIME TESTING
 * 
 * Purpose: Test WebSocket connection management, reconnection, and reliability
 * Features: Connection states, network issues, error handling, rate limiting
 * Test Scenarios: Normal connections, network failures, concurrent users
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { PUSHER_CONFIG, WEBSOCKET_CONFIG, DEFAULT_REALTIME_CONFIG } from '@/lib/realtime/config'

describe('WebSocket Connection Tests', () => {
    let server: WS
    let client: RealtimeClient
    let mockPusher: any

    // Mock Pusher for testing
    beforeAll(() => {
        // Mock Pusher.js
        vi.mock('pusher-js', () => ({
            default: vi.fn().mockImplementation(() => ({
                connect: vi.fn(),
                disconnect: vi.fn(),
                subscribe: vi.fn().mockReturnValue({
                    bind: vi.fn(),
                    unbind: vi.fn(),
                    trigger: vi.fn()
                }),
                unsubscribe: vi.fn(),
                bind: vi.fn(),
                unbind: vi.fn(),
                connection: {
                    state: 'disconnected',
                    bind: vi.fn(),
                    unbind: vi.fn()
                }
            }))
        }))
    })

    beforeEach(() => {
        // Mock WebSocket server
        server = new WS('ws://localhost:3001')
        
        // Create client with test configuration
        client = new RealtimeClient({
            userId: 'test-user-123',
            userName: 'Test User',
            userRole: 'family',
            sessionId: 'test-session-123',
            provider: 'websocket',
            autoReconnect: true
        })
    })

    afterEach(async () => {
        if (client) {
            client.disconnect()
        }
        if (server) {
            WS.clean()
        }
    })

    describe('Connection Establishment', () => {
        it('should establish WebSocket connection successfully', async () => {
            const connectionPromise = client.connect()
            await server.connected
            
            expect(server).toHaveReceivedConnectionParams()
            expect(client.getConnectionStatus()).toBe('connected')
            
            await connectionPromise
        })

        it('should handle connection timeout', async () => {
            // Close the server immediately to simulate timeout
            server.close()
            
            const connectionPromise = client.connect()
            
            try {
                await connectionPromise
                expect.fail('Connection should have failed')
            } catch (error: any) {
                expect(error.code).toBe('CONNECTION_FAILED')
                expect(error.recoverable).toBe(true)
            }
        })

        it('should handle invalid connection parameters', async () => {
            // Create client with invalid config
            const invalidClient = new RealtimeClient({
                userId: '',
                userName: '',
                userRole: 'family',
                sessionId: '',
                provider: 'websocket'
            })

            try {
                await invalidClient.connect()
                expect.fail('Connection should have failed with invalid params')
            } catch (error: any) {
                expect(error.code).toBe('CONNECTION_FAILED')
            }
        })

        it('should prevent multiple concurrent connections', async () => {
            const promise1 = client.connect()
            const promise2 = client.connect()
            
            await server.connected
            
            // Both promises should resolve to the same connection
            await Promise.all([promise1, promise2])
            expect(client.getConnectionStatus()).toBe('connected')
        })
    })

    describe('Connection States', () => {
        it('should track connection states correctly', async () => {
            const states: string[] = []
            
            client.on('connection:status', (event) => {
                states.push(event.data.status)
            })

            // Initial state
            expect(client.getConnectionStatus()).toBe('disconnected')

            // Connect
            const connectionPromise = client.connect()
            expect(client.getConnectionStatus()).toBe('connecting')

            await server.connected
            await connectionPromise
            expect(client.getConnectionStatus()).toBe('connected')

            // Disconnect
            client.disconnect()
            expect(client.getConnectionStatus()).toBe('disconnected')

            expect(states).toContain('connecting')
            expect(states).toContain('connected')
            expect(states).toContain('disconnected')
        })

        it('should handle error states', async () => {
            const errorStates: string[] = []
            
            client.on('error', (error) => {
                errorStates.push(error.code)
            })

            // Simulate server error
            const connectionPromise = client.connect()
            await server.connected
            server.error()

            expect(errorStates).toContain('WEBSOCKET_ERROR')
        })
    })

    describe('Reconnection Logic', () => {
        it('should attempt reconnection on unexpected disconnect', async () => {
            // Connect first
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            expect(client.getConnectionStatus()).toBe('connected')

            // Simulate unexpected disconnect
            server.close()
            
            // Wait for reconnection attempt
            await new Promise(resolve => setTimeout(resolve, 100))
            expect(client.getConnectionStatus()).toBe('reconnecting')
        })

        it('should respect maximum reconnection attempts', async () => {
            const attempts: number[] = []
            
            client.on('connection:status', (event) => {
                if (event.data.status === 'reconnecting') {
                    attempts.push(Date.now())
                }
            })

            // Connect and immediately close multiple times
            for (let i = 0; i < DEFAULT_REALTIME_CONFIG.maxReconnectAttempts + 2; i++) {
                const newServer = new WS('ws://localhost:3001')
                const connectionPromise = client.connect()
                await newServer.connected
                await connectionPromise
                newServer.close()
                await new Promise(resolve => setTimeout(resolve, 200))
                WS.clean()
            }

            // Should not exceed max attempts
            expect(attempts.length).toBeLessThanOrEqual(DEFAULT_REALTIME_CONFIG.maxReconnectAttempts)
        })

        it('should use exponential backoff for reconnection', async () => {
            const timestamps: number[] = []
            
            client.on('connection:status', (event) => {
                if (event.data.status === 'reconnecting') {
                    timestamps.push(Date.now())
                }
            })

            // Trigger multiple reconnection attempts
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            for (let i = 0; i < 3; i++) {
                server.close()
                await new Promise(resolve => setTimeout(resolve, 100))
                server = new WS('ws://localhost:3001')
            }

            // Check that intervals are increasing
            for (let i = 1; i < timestamps.length; i++) {
                const interval = timestamps[i] - timestamps[i - 1]
                const expectedMinInterval = DEFAULT_REALTIME_CONFIG.reconnectInterval * Math.pow(2, i - 1)
                expect(interval).toBeGreaterThanOrEqual(expectedMinInterval * 0.8) // Allow some variance
            }
        })
    })

    describe('Message Queuing', () => {
        it('should queue messages when disconnected', async () => {
            // Try to send message while disconnected
            const sendPromise = client.sendMessage('chat-123', 'Hello World')
            
            // Message should be queued
            expect(client.getState().messages).toHaveLength(0)
            
            // Connect and verify message is sent
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise
            
            // Wait for queued messages to be processed
            await new Promise(resolve => setTimeout(resolve, 100))
            
            expect(server).toHaveReceivedMessage(
                expect.objectContaining({
                    event: 'chat:message:sent',
                    data: expect.objectContaining({
                        content: 'Hello World'
                    })
                })
            )
        })

        it('should handle message queue overflow', async () => {
            // Fill up message queue while disconnected
            const promises = []
            for (let i = 0; i < 1000; i++) {
                promises.push(client.sendMessage('chat-123', `Message ${i}`))
            }

            // Connect and verify messages are processed in order
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Wait for all messages to be processed
            await Promise.all(promises)
        })
    })

    describe('Heartbeat and Keep-Alive', () => {
        it('should send heartbeat messages', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Wait for heartbeat interval
            await new Promise(resolve => setTimeout(resolve, DEFAULT_REALTIME_CONFIG.heartbeatInterval + 1000))

            expect(server).toHaveReceivedMessage(
                expect.objectContaining({
                    channel: 'heartbeat',
                    event: 'ping'
                })
            )
        })

        it('should detect connection loss via heartbeat', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Stop responding to heartbeats
            server.on('message', (data) => {
                const message = JSON.parse(data as string)
                if (message.event === 'ping') {
                    // Don't respond to heartbeat
                    return
                }
            })

            // Wait for heartbeat timeout
            await new Promise(resolve => setTimeout(resolve, DEFAULT_REALTIME_CONFIG.heartbeatInterval * 2))

            // Should detect connection loss and try to reconnect
            expect(client.getConnectionStatus()).toBe('reconnecting')
        })
    })

    describe('Concurrent Connections', () => {
        it('should handle multiple clients connecting simultaneously', async () => {
            const clients = []
            const servers = []

            // Create multiple clients and servers
            for (let i = 0; i < 10; i++) {
                const testServer = new WS(`ws://localhost:${3001 + i}`)
                const testClient = new RealtimeClient({
                    userId: `test-user-${i}`,
                    userName: `Test User ${i}`,
                    userRole: 'family',
                    sessionId: `test-session-${i}`,
                    provider: 'websocket',
                    websocketUrl: `ws://localhost:${3001 + i}`
                })

                clients.push(testClient)
                servers.push(testServer)
            }

            // Connect all clients simultaneously
            const connectionPromises = clients.map(client => client.connect())
            
            // Wait for all connections
            await Promise.all(servers.map(server => server.connected))
            await Promise.all(connectionPromises)

            // Verify all connections are established
            clients.forEach(client => {
                expect(client.getConnectionStatus()).toBe('connected')
            })

            // Cleanup
            clients.forEach(client => client.disconnect())
            servers.forEach(() => WS.clean())
        })

        it('should handle connection limit gracefully', async () => {
            // This would typically be tested against a real server with connection limits
            // For now, simulate by creating many connections rapidly
            const clients = []
            
            for (let i = 0; i < 100; i++) {
                const testClient = new RealtimeClient({
                    userId: `load-test-user-${i}`,
                    userName: `Load Test User ${i}`,
                    userRole: 'family',
                    sessionId: `load-test-session-${i}`,
                    provider: 'websocket'
                })
                clients.push(testClient)
            }

            // Attempt to connect all clients
            const results = await Promise.allSettled(
                clients.map(client => client.connect())
            )

            // Some connections might fail due to limits, but system should handle gracefully
            const successful = results.filter(result => result.status === 'fulfilled').length
            const failed = results.filter(result => result.status === 'rejected').length

            expect(successful + failed).toBe(100)
            expect(successful).toBeGreaterThan(0) // At least some should succeed

            // Cleanup
            clients.forEach(client => client.disconnect())
        })
    })

    describe('Network Conditions', () => {
        it('should handle slow network conditions', async () => {
            // Simulate slow connection by delaying server responses
            server.on('connection', () => {
                setTimeout(() => {
                    server.send(JSON.stringify({
                        event: 'connection:opened',
                        data: { timestamp: new Date().toISOString() }
                    }))
                }, 2000) // 2 second delay
            })

            const startTime = Date.now()
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise
            const endTime = Date.now()

            expect(endTime - startTime).toBeGreaterThan(1000) // Should take at least 1 second
            expect(client.getConnectionStatus()).toBe('connected')
        })

        it('should handle intermittent connectivity', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Simulate intermittent connectivity
            for (let i = 0; i < 5; i++) {
                server.close()
                await new Promise(resolve => setTimeout(resolve, 500))
                server = new WS('ws://localhost:3001')
                await server.connected
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            // Connection should eventually stabilize
            expect(client.getConnectionStatus()).toBe('connected')
        })

        it('should handle high latency scenarios', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Send message and measure round-trip time
            const startTime = Date.now()
            
            server.on('message', (data) => {
                // Simulate high latency response
                setTimeout(() => {
                    server.send(JSON.stringify({
                        event: 'message:received',
                        data: { timestamp: new Date().toISOString() }
                    }))
                }, 1000) // 1 second latency
            })

            await client.sendMessage('test-chat', 'High latency test')
            
            // Wait for response
            const response = await new Promise((resolve) => {
                client.on('message:received', resolve)
            })

            const endTime = Date.now()
            expect(endTime - startTime).toBeGreaterThan(1000)
        })
    })

    describe('Error Handling', () => {
        it('should handle malformed messages gracefully', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            const errorEvents: any[] = []
            client.on('error', (error) => {
                errorEvents.push(error)
            })

            // Send malformed JSON
            server.send('invalid json {')
            server.send('{"incomplete": ')
            server.send('null')
            server.send('')

            await new Promise(resolve => setTimeout(resolve, 100))

            // Connection should remain stable despite malformed messages
            expect(client.getConnectionStatus()).toBe('connected')
        })

        it('should handle server errors appropriately', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            const errorEvents: any[] = []
            client.on('error', (error) => {
                errorEvents.push(error)
            })

            // Simulate server error
            server.error()

            await new Promise(resolve => setTimeout(resolve, 100))

            expect(errorEvents.length).toBeGreaterThan(0)
            expect(errorEvents[0].code).toBe('WEBSOCKET_ERROR')
        })
    })

    describe('Memory Management', () => {
        it('should clean up resources on disconnect', () => {
            const initialEventListeners = client.listenerCount('connection:status')
            
            client.connect()
            client.disconnect()

            // Verify cleanup
            expect(client.getConnectionStatus()).toBe('disconnected')
            
            // Event listeners should be cleaned up
            const finalEventListeners = client.listenerCount('connection:status')
            expect(finalEventListeners).toBeLessThanOrEqual(initialEventListeners)
        })

        it('should handle memory pressure scenarios', async () => {
            const connectionPromise = client.connect()
            await server.connected
            await connectionPromise

            // Simulate memory pressure by creating many event handlers
            const handlers = []
            for (let i = 0; i < 10000; i++) {
                const handler = () => {}
                client.on('test:event', handler)
                handlers.push(handler)
            }

            // System should still function
            expect(client.getConnectionStatus()).toBe('connected')

            // Cleanup
            handlers.forEach(handler => {
                client.off('test:event', handler)
            })
        })
    })
})