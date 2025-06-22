/**
 * COLLABORATIVE FEATURES TESTS - COMPREHENSIVE REAL-TIME COLLABORATION TESTING
 * 
 * Purpose: Test collaborative document editing, conflict resolution, version control
 * Features: Document sharing, real-time editing, operational transforms, conflict resolution
 * Test Scenarios: Concurrent editing, merge conflicts, version history, document locks
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import WS from 'jest-websocket-mock'
import { RealtimeClient } from '@/lib/realtime/client'
import { CollaborativeManager, DocumentSession, EditOperation } from '@/lib/realtime/collaborative-planning'
import { DocumentSharingManager, SharedDocument, SharingPermissions } from '@/lib/realtime/document-sharing'
import { EVENTS, CHANNELS } from '@/lib/realtime/config'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Collaborative Features Tests', () => {
    let server: WS
    let client: RealtimeClient
    let collaborativeManager: CollaborativeManager
    let documentSharingManager: DocumentSharingManager
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

        collaborativeManager = new CollaborativeManager(client)
        documentSharingManager = new DocumentSharingManager(client)

        // Reset fetch mock
        mockFetch.mockReset()
    })

    afterEach(() => {
        if (client) {
            client.disconnect()
        }
        if (collaborativeManager) {
            collaborativeManager.destroy()
        }
        if (documentSharingManager) {
            documentSharingManager.destroy()
        }
        WS.clean()
    })

    describe('Document Session Management', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should create collaborative document session', async () => {
            const documentId = 'funeral-plan-123'
            const mockSession: DocumentSession = {
                id: 'session-456',
                documentId,
                participants: ['family-user-123'],
                version: 1,
                content: {
                    type: 'funeral_planning',
                    data: {
                        serviceDate: '2024-02-15',
                        venue: 'Memorial Chapel',
                        arrangements: []
                    }
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSession
            })

            const session = await collaborativeManager.createSession(documentId, {
                type: 'funeral_planning',
                permissions: ['read', 'write', 'comment']
            })

            expect(session).toEqual(mockSession)
            expect(mockFetch).toHaveBeenCalledWith('/api/collaborative/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify({
                    documentId,
                    type: 'funeral_planning',
                    permissions: ['read', 'write', 'comment']
                })
            })
        })

        it('should join existing document session', async () => {
            const sessionId = 'session-456'
            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'funeral-plan-123',
                participants: ['family-user-123', 'director-456'],
                version: 5,
                content: {
                    type: 'funeral_planning',
                    data: {
                        serviceDate: '2024-02-15',
                        venue: 'Memorial Chapel',
                        arrangements: [
                            { type: 'flowers', description: 'White lilies' }
                        ]
                    }
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSession
            })

            await collaborativeManager.joinSession(sessionId)

            const state = collaborativeManager.getState()
            expect(state.activeSessions.get(sessionId)).toEqual(mockSession)
            expect(state.activeSessions.get(sessionId)?.participants).toContain('family-user-123')
        })

        it('should handle session join with insufficient permissions', async () => {
            const sessionId = 'restricted-session-789'

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden'
            })

            try {
                await collaborativeManager.joinSession(sessionId)
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.message).toContain('Forbidden')
            }
        })
    })

    describe('Real-Time Document Editing', () => {
        let sessionId: string

        beforeEach(async () => {
            await client.connect()
            await server.connected

            sessionId = 'test-session-123'
            
            // Mock session
            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'test-doc-123',
                participants: ['family-user-123'],
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
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)
        })

        it('should apply local edit operations', async () => {
            const operation: EditOperation = {
                id: 'op-123',
                type: 'insert',
                path: ['serviceDate'],
                value: '2024-02-15',
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            await collaborativeManager.applyOperation(operation)

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            expect(session.content.data.serviceDate).toBe('2024-02-15')
            expect(session.operations).toContain(operation)
            expect(session.version).toBe(2)
        })

        it('should handle concurrent edits with operational transform', async () => {
            // Simulate concurrent edits to the same document
            const operation1: EditOperation = {
                id: 'op-1',
                type: 'insert',
                path: ['arrangements', 0],
                value: { type: 'flowers', description: 'Roses' },
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            const operation2: EditOperation = {
                id: 'op-2',
                type: 'insert',
                path: ['arrangements', 0],
                value: { type: 'music', description: 'Classical piano' },
                timestamp: new Date(Date.now() + 100).toISOString(),
                userId: 'director-456',
                sessionId
            }

            // Apply first operation locally
            await collaborativeManager.applyOperation(operation1)

            // Simulate receiving second operation from another user
            server.send(JSON.stringify({
                type: 'collaborative:operation',
                data: operation2
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            // Both operations should be applied with proper transformation
            expect(session.content.data.arrangements).toHaveLength(2)
            expect(session.content.data.arrangements[0].type).toBe('flowers')
            expect(session.content.data.arrangements[1].type).toBe('music')
        })

        it('should handle delete operations', async () => {
            // First add some content
            const insertOp: EditOperation = {
                id: 'op-insert',
                type: 'insert',
                path: ['arrangements', 0],
                value: { type: 'flowers', description: 'White lilies' },
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            await collaborativeManager.applyOperation(insertOp)

            // Then delete it
            const deleteOp: EditOperation = {
                id: 'op-delete',
                type: 'delete',
                path: ['arrangements', 0],
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            await collaborativeManager.applyOperation(deleteOp)

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            expect(session.content.data.arrangements).toHaveLength(0)
        })

        it('should handle update operations', async () => {
            // First add content
            const insertOp: EditOperation = {
                id: 'op-insert',
                type: 'insert',
                path: ['venue'],
                value: 'Memorial Chapel',
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            await collaborativeManager.applyOperation(insertOp)

            // Then update it
            const updateOp: EditOperation = {
                id: 'op-update',
                type: 'update',
                path: ['venue'],
                value: 'St. Mary\'s Church',
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            await collaborativeManager.applyOperation(updateOp)

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            expect(session.content.data.venue).toBe('St. Mary\'s Church')
        })
    })

    describe('Conflict Resolution', () => {
        let sessionId: string

        beforeEach(async () => {
            await client.connect()
            await server.connected

            sessionId = 'conflict-session-123'
            
            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'conflict-doc-123',
                participants: ['family-user-123', 'director-456'],
                version: 1,
                content: {
                    type: 'funeral_planning',
                    data: {
                        serviceDate: '2024-02-15',
                        venue: 'Memorial Chapel',
                        arrangements: []
                    }
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)
        })

        it('should resolve conflicting updates to same field', async () => {
            const timestamp = Date.now()

            // Family user changes venue
            const familyOp: EditOperation = {
                id: 'op-family',
                type: 'update',
                path: ['venue'],
                value: 'St. Peter\'s Cathedral',
                timestamp: new Date(timestamp).toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            // Director changes venue at nearly same time
            const directorOp: EditOperation = {
                id: 'op-director',
                type: 'update',
                path: ['venue'],
                value: 'Grace Methodist Church',
                timestamp: new Date(timestamp + 50).toISOString(),
                userId: 'director-456',
                sessionId
            }

            // Apply family operation first
            await collaborativeManager.applyOperation(familyOp)

            // Simulate receiving director operation
            server.send(JSON.stringify({
                type: 'collaborative:operation',
                data: directorOp
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            // Last-write-wins by timestamp (director's change should win)
            expect(session.content.data.venue).toBe('Grace Methodist Church')
            
            // Should track the conflict
            expect(state.conflicts.get(sessionId)).toBeDefined()
            expect(state.conflicts.get(sessionId)?.length).toBeGreaterThan(0)
        })

        it('should handle insertion conflicts', async () => {
            const timestamp = Date.now()

            // Both users try to insert at same position
            const op1: EditOperation = {
                id: 'op-1',
                type: 'insert',
                path: ['arrangements', 0],
                value: { type: 'flowers', description: 'Roses' },
                timestamp: new Date(timestamp).toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            const op2: EditOperation = {
                id: 'op-2',
                type: 'insert',
                path: ['arrangements', 0],
                value: { type: 'music', description: 'Organ music' },
                timestamp: new Date(timestamp + 10).toISOString(),
                userId: 'director-456',
                sessionId
            }

            await collaborativeManager.applyOperation(op1)

            server.send(JSON.stringify({
                type: 'collaborative:operation',
                data: op2
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            // Both items should be present, with proper ordering
            expect(session.content.data.arrangements).toHaveLength(2)
            expect(session.content.data.arrangements[0].type).toBe('flowers')
            expect(session.content.data.arrangements[1].type).toBe('music')
        })

        it('should provide conflict resolution options', async () => {
            const conflictId = 'conflict-123'
            
            // Create a conflict scenario
            const op1: EditOperation = {
                id: 'op-1',
                type: 'update',
                path: ['serviceDate'],
                value: '2024-02-15',
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            const op2: EditOperation = {
                id: 'op-2',
                type: 'update',
                path: ['serviceDate'],
                value: '2024-02-20',
                timestamp: new Date().toISOString(),
                userId: 'director-456',
                sessionId
            }

            await collaborativeManager.applyOperation(op1)
            
            server.send(JSON.stringify({
                type: 'collaborative:operation',
                data: op2
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            // Get resolution options
            const resolutionOptions = await collaborativeManager.getConflictResolutionOptions(conflictId)
            
            expect(resolutionOptions).toEqual({
                conflictId,
                type: 'field_conflict',
                field: 'serviceDate',
                options: [
                    { value: '2024-02-15', source: 'family-user-123', timestamp: expect.any(String) },
                    { value: '2024-02-20', source: 'director-456', timestamp: expect.any(String) }
                ],
                suggestedResolution: 'manual_choice'
            })
        })

        it('should apply conflict resolution', async () => {
            const conflictId = 'conflict-123'
            
            // Simulate conflict exists
            collaborativeManager.getState().conflicts.set(sessionId, [{
                id: conflictId,
                type: 'field_conflict',
                field: 'serviceDate',
                operations: [
                    {
                        id: 'op-1',
                        type: 'update',
                        path: ['serviceDate'],
                        value: '2024-02-15',
                        timestamp: new Date().toISOString(),
                        userId: 'family-user-123',
                        sessionId
                    },
                    {
                        id: 'op-2',
                        type: 'update',
                        path: ['serviceDate'],
                        value: '2024-02-20',
                        timestamp: new Date().toISOString(),
                        userId: 'director-456',
                        sessionId
                    }
                ],
                createdAt: new Date().toISOString()
            }])

            mockFetch.mockResolvedValueOnce({ ok: true })

            await collaborativeManager.resolveConflict(conflictId, {
                resolution: 'choose_option',
                selectedValue: '2024-02-20',
                resolvedBy: 'family-user-123'
            })

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            expect(session.content.data.serviceDate).toBe('2024-02-20')
            expect(state.conflicts.get(sessionId)).toHaveLength(0)
        })
    })

    describe('Document Sharing', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should share document with specific users', async () => {
            const documentId = 'funeral-plan-123'
            const sharing: SharingPermissions = {
                documentId,
                sharedWith: [
                    {
                        userId: 'director-456',
                        userName: 'Funeral Director',
                        permissions: ['read', 'write', 'comment'],
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        userId: 'venue-789',
                        userName: 'Venue Manager',
                        permissions: ['read', 'comment'],
                        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                shareMode: 'specific_users',
                requiresLogin: true,
                allowDownload: false,
                trackViews: true
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ shareId: 'share-123', ...sharing })
            })

            const shareResult = await documentSharingManager.shareDocument(sharing)

            expect(shareResult.shareId).toBe('share-123')
            expect(mockFetch).toHaveBeenCalledWith('/api/documents/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify(sharing)
            })
        })

        it('should generate public share link', async () => {
            const documentId = 'funeral-plan-123'
            const publicSharing: SharingPermissions = {
                documentId,
                sharedWith: [],
                shareMode: 'public_link',
                requiresLogin: false,
                allowDownload: true,
                trackViews: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }

            const mockShareResult = {
                shareId: 'public-share-456',
                publicUrl: 'https://farewelly.app/shared/public-share-456',
                ...publicSharing
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockShareResult
            })

            const shareResult = await documentSharingManager.shareDocument(publicSharing)

            expect(shareResult.publicUrl).toBeDefined()
            expect(shareResult.shareMode).toBe('public_link')
        })

        it('should track document access', async () => {
            const shareId = 'share-123'
            const accessEvent = {
                shareId,
                accessedBy: 'director-456',
                accessType: 'view',
                timestamp: new Date().toISOString(),
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...'
            }

            // Simulate receiving access tracking event
            server.send(JSON.stringify({
                type: 'document:access',
                data: accessEvent
            }))

            await new Promise(resolve => setTimeout(resolve, 100))

            const state = documentSharingManager.getState()
            expect(state.accessLogs.get(shareId)).toBeDefined()
            expect(state.accessLogs.get(shareId)![0]).toEqual(accessEvent)
        })

        it('should handle permission expiration', async () => {
            const documentId = 'funeral-plan-123'
            const expiredShare: SharedDocument = {
                id: 'expired-share-789',
                documentId,
                sharedBy: 'family-user-123',
                sharedWith: [{
                    userId: 'temp-user-999',
                    userName: 'Temporary User',
                    permissions: ['read'],
                    expiresAt: new Date(Date.now() - 60000).toISOString() // Expired 1 minute ago
                }],
                shareMode: 'specific_users',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            documentSharingManager.getState().sharedDocuments.set('expired-share-789', expiredShare)

            // Check permissions
            const hasPermission = await documentSharingManager.checkUserPermission(
                'expired-share-789', 
                'temp-user-999', 
                'read'
            )

            expect(hasPermission).toBe(false)
        })
    })

    describe('Version Control', () => {
        let sessionId: string

        beforeEach(async () => {
            await client.connect()
            await server.connected

            sessionId = 'version-session-123'
            
            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'version-doc-123',
                participants: ['family-user-123'],
                version: 1,
                content: {
                    type: 'funeral_planning',
                    data: {
                        serviceDate: '2024-02-15',
                        venue: 'Memorial Chapel'
                    }
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)
        })

        it('should create version snapshots', async () => {
            // Make several changes
            const operations = [
                {
                    id: 'op-1',
                    type: 'update' as const,
                    path: ['venue'],
                    value: 'St. Peter\'s Church',
                    timestamp: new Date().toISOString(),
                    userId: 'family-user-123',
                    sessionId
                },
                {
                    id: 'op-2',
                    type: 'insert' as const,
                    path: ['arrangements', 0],
                    value: { type: 'flowers', description: 'White roses' },
                    timestamp: new Date().toISOString(),
                    userId: 'family-user-123',
                    sessionId
                }
            ]

            for (const op of operations) {
                await collaborativeManager.applyOperation(op)
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ versionId: 'v2', snapshotId: 'snapshot-123' })
            })

            const snapshot = await collaborativeManager.createVersionSnapshot(sessionId, {
                comment: 'Added venue and flower arrangements',
                major: false
            })

            expect(snapshot.versionId).toBe('v2')
            expect(mockFetch).toHaveBeenCalledWith('/api/collaborative/versions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer user-auth-token'
                },
                body: JSON.stringify({
                    sessionId,
                    comment: 'Added venue and flower arrangements',
                    major: false,
                    content: expect.any(Object)
                })
            })
        })

        it('should revert to previous version', async () => {
            const targetVersion = 'v1'
            const revertedContent = {
                type: 'funeral_planning',
                data: {
                    serviceDate: '2024-02-15',
                    venue: 'Memorial Chapel'
                }
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    version: targetVersion,
                    content: revertedContent,
                    operations: []
                })
            })

            await collaborativeManager.revertToVersion(sessionId, targetVersion)

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            
            expect(session.content).toEqual(revertedContent)
        })

        it('should show version history', async () => {
            const mockVersionHistory = [
                {
                    id: 'v3',
                    sessionId,
                    version: 3,
                    comment: 'Final arrangements confirmed',
                    createdBy: 'director-456',
                    createdAt: new Date().toISOString(),
                    major: true
                },
                {
                    id: 'v2',
                    sessionId,
                    version: 2,
                    comment: 'Added venue and flowers',
                    createdBy: 'family-user-123',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    major: false
                },
                {
                    id: 'v1',
                    sessionId,
                    version: 1,
                    comment: 'Initial version',
                    createdBy: 'family-user-123',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    major: true
                }
            ]

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockVersionHistory
            })

            const history = await collaborativeManager.getVersionHistory(sessionId)

            expect(history).toEqual(mockVersionHistory)
            expect(history).toHaveLength(3)
            expect(history[0].version).toBe(3) // Most recent first
        })
    })

    describe('Document Locking', () => {
        let sessionId: string

        beforeEach(async () => {
            await client.connect()
            await server.connected

            sessionId = 'lock-session-123'
            
            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'lock-doc-123',
                participants: ['family-user-123', 'director-456'],
                version: 1,
                content: {
                    type: 'funeral_planning',
                    data: {}
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)
        })

        it('should acquire document lock', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    lockId: 'lock-123',
                    sessionId,
                    lockedBy: 'family-user-123',
                    lockType: 'exclusive',
                    expiresAt: new Date(Date.now() + 300000).toISOString()
                })
            })

            const lock = await collaborativeManager.acquireLock(sessionId, 'exclusive')

            expect(lock.lockId).toBe('lock-123')
            expect(lock.lockedBy).toBe('family-user-123')
            
            const state = collaborativeManager.getState()
            expect(state.locks.get(sessionId)).toEqual(lock)
        })

        it('should handle lock conflicts', async () => {
            // Simulate document already locked by another user
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: async () => ({
                    error: 'Document already locked',
                    lockedBy: 'director-456',
                    lockType: 'exclusive',
                    expiresAt: new Date(Date.now() + 240000).toISOString()
                })
            })

            try {
                await collaborativeManager.acquireLock(sessionId, 'exclusive')
                expect.fail('Should have thrown error')
            } catch (error: any) {
                expect(error.message).toContain('Document already locked')
                expect(error.lockedBy).toBe('director-456')
            }
        })

        it('should release document lock', async () => {
            const lockId = 'lock-123'
            
            // First set up a lock
            collaborativeManager.getState().locks.set(sessionId, {
                lockId,
                sessionId,
                lockedBy: 'family-user-123',
                lockType: 'exclusive',
                acquiredAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 300000).toISOString()
            })

            mockFetch.mockResolvedValueOnce({ ok: true })

            await collaborativeManager.releaseLock(sessionId)

            expect(mockFetch).toHaveBeenCalledWith(`/api/collaborative/locks/${lockId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer user-auth-token'
                }
            })

            const state = collaborativeManager.getState()
            expect(state.locks.has(sessionId)).toBe(false)
        })

        it('should handle lock expiration', async () => {
            const expiredLock = {
                lockId: 'expired-lock-456',
                sessionId,
                lockedBy: 'family-user-123',
                lockType: 'exclusive',
                acquiredAt: new Date(Date.now() - 400000).toISOString(),
                expiresAt: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
            }

            collaborativeManager.getState().locks.set(sessionId, expiredLock)

            // Try to apply operation with expired lock
            const operation: EditOperation = {
                id: 'op-with-expired-lock',
                type: 'update',
                path: ['venue'],
                value: 'New Venue',
                timestamp: new Date().toISOString(),
                userId: 'family-user-123',
                sessionId
            }

            try {
                await collaborativeManager.applyOperation(operation, { requireLock: true })
                expect.fail('Should have failed due to expired lock')
            } catch (error: any) {
                expect(error.code).toBe('LOCK_EXPIRED')
            }
        })
    })

    describe('Performance and Scalability', () => {
        beforeEach(async () => {
            await client.connect()
            await server.connected
        })

        it('should handle large documents efficiently', async () => {
            const sessionId = 'large-doc-session'
            
            // Create large document content
            const largeContent = {
                type: 'funeral_planning',
                data: {
                    arrangements: Array.from({ length: 1000 }, (_, i) => ({
                        id: `arrangement-${i}`,
                        type: 'misc',
                        description: `Large arrangement item ${i}`,
                        details: 'Lorem ipsum '.repeat(100)
                    }))
                }
            }

            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'large-doc-123',
                participants: ['family-user-123'],
                version: 1,
                content: largeContent,
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)

            const startTime = Date.now()

            // Apply many operations
            for (let i = 0; i < 100; i++) {
                await collaborativeManager.applyOperation({
                    id: `op-${i}`,
                    type: 'update',
                    path: ['arrangements', i, 'description'],
                    value: `Updated arrangement ${i}`,
                    timestamp: new Date().toISOString(),
                    userId: 'family-user-123',
                    sessionId
                })
            }

            const endTime = Date.now()

            // Should handle efficiently
            expect(endTime - startTime).toBeLessThan(2000)
        })

        it('should handle many concurrent users', async () => {
            const sessionId = 'many-users-session'
            const userCount = 50

            const mockSession: DocumentSession = {
                id: sessionId,
                documentId: 'many-users-doc',
                participants: Array.from({ length: userCount }, (_, i) => `user-${i}`),
                version: 1,
                content: {
                    type: 'funeral_planning',
                    data: { arrangements: [] }
                },
                operations: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            collaborativeManager.getState().activeSessions.set(sessionId, mockSession)

            const startTime = Date.now()

            // Simulate operations from many users
            const operations = Array.from({ length: userCount }, (_, i) => ({
                id: `op-user-${i}`,
                type: 'insert' as const,
                path: ['arrangements', i],
                value: { type: 'item', description: `Item from user ${i}` },
                timestamp: new Date(Date.now() + i * 10).toISOString(),
                userId: `user-${i}`,
                sessionId
            }))

            // Apply operations concurrently
            await Promise.all(operations.map(op => 
                collaborativeManager.applyOperation(op)
            ))

            const endTime = Date.now()

            // Should handle concurrent operations efficiently
            expect(endTime - startTime).toBeLessThan(3000)

            const state = collaborativeManager.getState()
            const session = state.activeSessions.get(sessionId)!
            expect(session.content.data.arrangements).toHaveLength(userCount)
        })
    })
})