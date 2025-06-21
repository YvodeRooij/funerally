/**
 * COLLABORATIVE PLANNING SYSTEM - REAL-TIME PLANNING & EDITING
 * 
 * Purpose: Comprehensive collaborative planning with real-time editing capabilities
 * Features: Multi-user planning, task management, document collaboration, timeline sharing
 * Architecture: Operational Transform system with conflict resolution and version control
 */

'use client'

import { 
  Planning, 
  PlanningTask, 
  PlanningComment, 
  PlanningId, 
  UserId, 
  FamilyId, 
  DirectorId,
  DocumentInfo,
  RealtimeEvent 
} from './types'
import { CHANNELS, EVENTS, FEATURE_FLAGS } from './config'
import { RealtimeClient } from './client'

export interface CollaborativeOperation {
  id: string
  type: 'insert' | 'delete' | 'retain' | 'format' | 'attribute'
  position: number
  content?: string
  length?: number
  attributes?: Record<string, any>
  timestamp: string
  userId: UserId
  userName: string
}

export interface PlanningChange {
  id: string
  planningId: PlanningId
  operation: CollaborativeOperation
  version: number
  timestamp: string
  userId: UserId
  applied: boolean
}

export interface PlanningSnapshot {
  id: string
  planningId: PlanningId
  content: Planning
  version: number
  timestamp: string
  createdBy: UserId
}

export interface CollaboratorCursor {
  userId: UserId
  userName: string
  position: number
  selection?: {
    start: number
    end: number
  }
  color: string
  timestamp: string
}

export interface PlanningSession {
  id: string
  planningId: PlanningId
  participants: Array<{
    userId: UserId
    userName: string
    role: 'owner' | 'editor' | 'viewer'
    joinedAt: string
    lastActive: string
    cursor?: CollaboratorCursor
  }>
  version: number
  lastSaved: string
  hasUnsavedChanges: boolean
  lockStatus: {
    isLocked: boolean
    lockedBy?: UserId
    lockedAt?: string
    reason?: string
  }
}

export interface PlanningConflict {
  id: string
  planningId: PlanningId
  operations: CollaborativeOperation[]
  conflictType: 'concurrent_edit' | 'version_mismatch' | 'permission_denied'
  description: string
  timestamp: string
  resolved: boolean
  resolution?: 'accept_local' | 'accept_remote' | 'merge' | 'manual'
}

export interface PlanningState {
  plans: Map<PlanningId, Planning>
  sessions: Map<PlanningId, PlanningSession>
  operations: Map<PlanningId, CollaborativeOperation[]>
  conflicts: Map<PlanningId, PlanningConflict[]>
  cursors: Map<PlanningId, Map<UserId, CollaboratorCursor>>
  snapshots: Map<PlanningId, PlanningSnapshot[]>
  loading: Map<PlanningId, boolean>
  error?: string
}

export class CollaborativePlanningManager {
  private client: RealtimeClient
  private state: PlanningState
  private operationQueue = new Map<PlanningId, CollaborativeOperation[]>()
  private versionVectors = new Map<PlanningId, Map<UserId, number>>()
  private transformationCache = new Map<string, CollaborativeOperation>()
  private cursorUpdateTimer?: NodeJS.Timeout
  private saveTimer?: NodeJS.Timeout
  private listeners = new Set<(state: PlanningState) => void>()

  constructor(client: RealtimeClient) {
    this.client = client
    this.state = {
      plans: new Map(),
      sessions: new Map(),
      operations: new Map(),
      conflicts: new Map(),
      cursors: new Map(),
      snapshots: new Map(),
      loading: new Map(),
    }
    
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Planning events
    this.client.on('planning:updated', this.handlePlanningUpdated.bind(this))
    this.client.on('planning:operation', this.handleOperation.bind(this))
    this.client.on('planning:cursor', this.handleCursorUpdate.bind(this))
    this.client.on('planning:participant:joined', this.handleParticipantJoined.bind(this))
    this.client.on('planning:participant:left', this.handleParticipantLeft.bind(this))
    this.client.on('planning:locked', this.handlePlanningLocked.bind(this))
    this.client.on('planning:unlocked', this.handlePlanningUnlocked.bind(this))
    this.client.on('planning:conflict', this.handleConflict.bind(this))
    
    // Task events
    this.client.on('planning:task:added', this.handleTaskAdded.bind(this))
    this.client.on('planning:task:updated', this.handleTaskUpdated.bind(this))
    this.client.on('planning:task:completed', this.handleTaskCompleted.bind(this))
    this.client.on('planning:task:deleted', this.handleTaskDeleted.bind(this))
    
    // Comment events
    this.client.on('planning:comment:added', this.handleCommentAdded.bind(this))
    this.client.on('planning:comment:updated', this.handleCommentUpdated.bind(this))
    this.client.on('planning:comment:deleted', this.handleCommentDeleted.bind(this))
  }

  // Planning management
  async createPlanning(
    familyId: FamilyId,
    directorId: DirectorId,
    title: string,
    description?: string
  ): Promise<Planning> {
    const planningId = this.generatePlanningId()
    
    const planning: Planning = {
      id: planningId,
      familyId,
      directorId,
      title,
      description,
      status: 'draft',
      tasks: [],
      timeline: [],
      collaborators: [
        {
          userId: familyId,
          role: 'owner',
          addedAt: new Date().toISOString(),
        },
        {
          userId: directorId,
          role: 'editor',
          addedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store locally
    this.state.plans.set(planningId, planning)
    
    // Create initial session
    const session: PlanningSession = {
      id: this.generateSessionId(),
      planningId,
      participants: [],
      version: 1,
      lastSaved: new Date().toISOString(),
      hasUnsavedChanges: false,
      lockStatus: { isLocked: false },
    }
    
    this.state.sessions.set(planningId, session)
    this.state.operations.set(planningId, [])
    this.state.cursors.set(planningId, new Map())

    try {
      // Save to server
      const response = await fetch('/api/realtime/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(planning),
      })

      if (!response.ok) {
        throw new Error(`Failed to create planning: ${response.statusText}`)
      }

      const savedPlanning = await response.json()
      this.state.plans.set(planningId, savedPlanning)
      
      // Subscribe to planning channel
      this.subscribeToPlanning(planningId)
      
    } catch (error) {
      this.state.error = `Failed to create planning: ${error}`
      throw error
    }
    
    this.notifyStateChange()
    return planning
  }

  async joinPlanning(planningId: PlanningId): Promise<void> {
    this.state.loading.set(planningId, true)
    this.notifyStateChange()

    try {
      // Load planning data
      await this.loadPlanning(planningId)
      
      // Subscribe to planning channel
      this.subscribeToPlanning(planningId)
      
      // Join session
      await this.joinPlanningSession(planningId)
      
    } catch (error) {
      this.state.error = `Failed to join planning: ${error}`
      throw error
    } finally {
      this.state.loading.set(planningId, false)
      this.notifyStateChange()
    }
  }

  private async loadPlanning(planningId: PlanningId): Promise<void> {
    const response = await fetch(`/api/realtime/planning/${planningId}`, {
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load planning: ${response.statusText}`)
    }

    const data = await response.json()
    this.state.plans.set(planningId, data.planning)
    
    const session: PlanningSession = data.session || {
      id: this.generateSessionId(),
      planningId,
      participants: [],
      version: data.planning.version || 1,
      lastSaved: data.planning.updatedAt,
      hasUnsavedChanges: false,
      lockStatus: { isLocked: false },
    }
    
    this.state.sessions.set(planningId, session)
    this.state.operations.set(planningId, data.operations || [])
    this.state.cursors.set(planningId, new Map())
  }

  private subscribeToPlanning(planningId: PlanningId): void {
    const channel = CHANNELS.FAMILY_PLANNING(planningId)
    
    this.client.subscribe(channel, [
      'planning:updated',
      'planning:operation',
      'planning:cursor',
      'planning:participant:joined',
      'planning:participant:left',
      'planning:locked',
      'planning:unlocked',
      'planning:conflict',
      'planning:task:added',
      'planning:task:updated',
      'planning:task:completed',
      'planning:task:deleted',
      'planning:comment:added',
      'planning:comment:updated',
      'planning:comment:deleted',
    ])
  }

  private async joinPlanningSession(planningId: PlanningId): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const session = this.state.sessions.get(planningId)
    if (!session) return

    // Add user to participants
    const participant = {
      userId: currentUser.userId,
      userName: currentUser.userName,
      role: 'editor' as const,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    }

    session.participants.push(participant)

    // Announce joining
    await this.sendOperation(planningId, {
      id: this.generateOperationId(),
      type: 'attribute',
      position: 0,
      attributes: { action: 'participant_joined', participant },
      timestamp: new Date().toISOString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
    })
  }

  // Collaborative operations
  async applyOperation(planningId: PlanningId, operation: CollaborativeOperation): Promise<void> {
    const planning = this.state.plans.get(planningId)
    const session = this.state.sessions.get(planningId)
    
    if (!planning || !session) return
    if (session.lockStatus.isLocked && session.lockStatus.lockedBy !== operation.userId) {
      throw new Error('Planning is locked by another user')
    }

    // Add to operation queue for transformation
    const queue = this.operationQueue.get(planningId) || []
    queue.push(operation)
    this.operationQueue.set(planningId, queue)

    // Transform against concurrent operations
    const transformedOperation = await this.transformOperation(planningId, operation)
    
    // Apply operation to local state
    this.applyOperationToPlanning(planning, transformedOperation)
    
    // Update version
    session.version++
    session.hasUnsavedChanges = true
    session.lastSaved = new Date().toISOString()

    // Store operation
    const operations = this.state.operations.get(planningId) || []
    operations.push(transformedOperation)
    this.state.operations.set(planningId, operations)

    // Send to other collaborators
    await this.sendOperation(planningId, transformedOperation)
    
    // Schedule save
    this.scheduleSave(planningId)
    
    this.notifyStateChange()
  }

  private async transformOperation(
    planningId: PlanningId,
    operation: CollaborativeOperation
  ): Promise<CollaborativeOperation> {
    const queue = this.operationQueue.get(planningId) || []
    let transformed = { ...operation }

    // Transform against all operations in queue
    for (const queuedOp of queue) {
      if (queuedOp.id !== operation.id && queuedOp.timestamp < operation.timestamp) {
        transformed = this.operationalTransform(transformed, queuedOp)
      }
    }

    return transformed
  }

  private operationalTransform(
    operation1: CollaborativeOperation,
    operation2: CollaborativeOperation
  ): CollaborativeOperation {
    // Simple operational transform implementation
    // In production, you'd want a more sophisticated OT algorithm
    
    const cacheKey = `${operation1.id}-${operation2.id}`
    const cached = this.transformationCache.get(cacheKey)
    if (cached) return cached

    let transformed = { ...operation1 }

    if (operation1.type === 'insert' && operation2.type === 'insert') {
      if (operation2.position <= operation1.position) {
        transformed.position += operation2.content?.length || 0
      }
    } else if (operation1.type === 'insert' && operation2.type === 'delete') {
      if (operation2.position < operation1.position) {
        transformed.position -= Math.min(operation2.length || 0, 
          operation1.position - operation2.position)
      }
    } else if (operation1.type === 'delete' && operation2.type === 'insert') {
      if (operation2.position <= operation1.position) {
        transformed.position += operation2.content?.length || 0
      }
    } else if (operation1.type === 'delete' && operation2.type === 'delete') {
      if (operation2.position < operation1.position) {
        transformed.position -= Math.min(operation2.length || 0,
          operation1.position - operation2.position)
      } else if (operation2.position < operation1.position + (operation1.length || 0)) {
        // Overlapping deletes - adjust length
        const overlap = Math.min(
          (operation1.position + (operation1.length || 0)) - operation2.position,
          operation2.length || 0
        )
        transformed.length = (transformed.length || 0) - overlap
      }
    }

    this.transformationCache.set(cacheKey, transformed)
    return transformed
  }

  private applyOperationToPlanning(planning: Planning, operation: CollaborativeOperation): void {
    switch (operation.type) {
      case 'insert':
        // Handle text insertion in planning description or other text fields
        if (operation.attributes?.field === 'description' && operation.content) {
          const desc = planning.description || ''
          planning.description = desc.slice(0, operation.position) + 
            operation.content + desc.slice(operation.position)
        }
        break
        
      case 'delete':
        // Handle text deletion
        if (operation.attributes?.field === 'description') {
          const desc = planning.description || ''
          planning.description = desc.slice(0, operation.position) + 
            desc.slice(operation.position + (operation.length || 0))
        }
        break
        
      case 'attribute':
        // Handle attribute changes (task updates, etc.)
        if (operation.attributes) {
          this.applyAttributeOperation(planning, operation.attributes)
        }
        break
    }
    
    planning.updatedAt = new Date().toISOString()
  }

  private applyAttributeOperation(planning: Planning, attributes: Record<string, any>): void {
    switch (attributes.action) {
      case 'task_added':
        if (attributes.task) {
          planning.tasks.push(attributes.task)
        }
        break
        
      case 'task_updated':
        if (attributes.taskId && attributes.updates) {
          const taskIndex = planning.tasks.findIndex(t => t.id === attributes.taskId)
          if (taskIndex !== -1) {
            Object.assign(planning.tasks[taskIndex], attributes.updates)
          }
        }
        break
        
      case 'task_deleted':
        if (attributes.taskId) {
          planning.tasks = planning.tasks.filter(t => t.id !== attributes.taskId)
        }
        break
        
      case 'timeline_updated':
        if (attributes.timeline) {
          planning.timeline = attributes.timeline
        }
        break
        
      case 'status_changed':
        if (attributes.status) {
          planning.status = attributes.status
        }
        break
    }
  }

  private async sendOperation(planningId: PlanningId, operation: CollaborativeOperation): Promise<void> {
    try {
      const channel = CHANNELS.FAMILY_PLANNING(planningId)
      await fetch('/api/realtime/planning/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          planningId,
          operation,
          channel,
        }),
      })
    } catch (error) {
      console.error('[CollaborativePlanningManager] Failed to send operation:', error)
    }
  }

  // Task management
  async addTask(
    planningId: PlanningId,
    task: Omit<PlanningTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const newTask: PlanningTask = {
      ...task,
      id: this.generateTaskId(),
      createdBy: currentUser.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.applyOperation(planningId, {
      id: this.generateOperationId(),
      type: 'attribute',
      position: 0,
      attributes: { action: 'task_added', task: newTask },
      timestamp: new Date().toISOString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
    })
  }

  async updateTask(
    planningId: PlanningId,
    taskId: string,
    updates: Partial<PlanningTask>
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    await this.applyOperation(planningId, {
      id: this.generateOperationId(),
      type: 'attribute',
      position: 0,
      attributes: { 
        action: 'task_updated', 
        taskId, 
        updates: { ...updates, updatedAt: new Date().toISOString() } 
      },
      timestamp: new Date().toISOString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
    })
  }

  async completeTask(planningId: PlanningId, taskId: string): Promise<void> {
    await this.updateTask(planningId, taskId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
  }

  async deleteTask(planningId: PlanningId, taskId: string): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    await this.applyOperation(planningId, {
      id: this.generateOperationId(),
      type: 'attribute',
      position: 0,
      attributes: { action: 'task_deleted', taskId },
      timestamp: new Date().toISOString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
    })
  }

  // Comment management
  async addComment(
    planningId: PlanningId,
    taskId: string,
    content: string
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const comment: PlanningComment = {
      id: this.generateCommentId(),
      taskId,
      userId: currentUser.userId,
      userName: currentUser.userName,
      content,
      timestamp: new Date().toISOString(),
    }

    await this.applyOperation(planningId, {
      id: this.generateOperationId(),
      type: 'attribute',
      position: 0,
      attributes: { action: 'comment_added', comment },
      timestamp: new Date().toISOString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
    })
  }

  // Cursor management
  async updateCursor(planningId: PlanningId, position: number, selection?: { start: number, end: number }): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const cursor: CollaboratorCursor = {
      userId: currentUser.userId,
      userName: currentUser.userName,
      position,
      selection,
      color: this.getUserColor(currentUser.userId),
      timestamp: new Date().toISOString(),
    }

    // Update local state
    const cursors = this.state.cursors.get(planningId) || new Map()
    cursors.set(currentUser.userId, cursor)
    this.state.cursors.set(planningId, cursors)

    // Throttle cursor updates
    if (this.cursorUpdateTimer) return
    
    this.cursorUpdateTimer = setTimeout(async () => {
      await this.sendCursorUpdate(planningId, cursor)
      this.cursorUpdateTimer = undefined
    }, 100)
  }

  private async sendCursorUpdate(planningId: PlanningId, cursor: CollaboratorCursor): Promise<void> {
    try {
      await fetch('/api/realtime/planning/cursor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ planningId, cursor }),
      })
    } catch (error) {
      console.error('[CollaborativePlanningManager] Failed to send cursor update:', error)
    }
  }

  // Event handlers
  private handlePlanningUpdated(event: RealtimeEvent<any>): void {
    const { planning } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleOperation(event: RealtimeEvent<any>): void {
    const { planningId, operation } = event.data
    const planning = this.state.plans.get(planningId)
    
    if (planning && operation.userId !== this.client.getState().presence.currentUser?.userId) {
      this.applyOperationToPlanning(planning, operation)
      
      const operations = this.state.operations.get(planningId) || []
      operations.push(operation)
      this.state.operations.set(planningId, operations)
      
      this.notifyStateChange()
    }
  }

  private handleCursorUpdate(event: RealtimeEvent<any>): void {
    const { planningId, cursor } = event.data
    const cursors = this.state.cursors.get(planningId) || new Map()
    cursors.set(cursor.userId, cursor)
    this.state.cursors.set(planningId, cursors)
    this.notifyStateChange()
  }

  private handleParticipantJoined(event: RealtimeEvent<any>): void {
    const { planningId, participant } = event.data
    const session = this.state.sessions.get(planningId)
    
    if (session) {
      session.participants.push(participant)
      this.notifyStateChange()
    }
  }

  private handleParticipantLeft(event: RealtimeEvent<any>): void {
    const { planningId, userId } = event.data
    const session = this.state.sessions.get(planningId)
    
    if (session) {
      session.participants = session.participants.filter(p => p.userId !== userId)
      
      // Remove cursor
      const cursors = this.state.cursors.get(planningId)
      if (cursors) {
        cursors.delete(userId)
      }
      
      this.notifyStateChange()
    }
  }

  private handlePlanningLocked(event: RealtimeEvent<any>): void {
    const { planningId, lockedBy, reason } = event.data
    const session = this.state.sessions.get(planningId)
    
    if (session) {
      session.lockStatus = {
        isLocked: true,
        lockedBy,
        lockedAt: event.timestamp,
        reason,
      }
      this.notifyStateChange()
    }
  }

  private handlePlanningUnlocked(event: RealtimeEvent<any>): void {
    const { planningId } = event.data
    const session = this.state.sessions.get(planningId)
    
    if (session) {
      session.lockStatus = { isLocked: false }
      this.notifyStateChange()
    }
  }

  private handleConflict(event: RealtimeEvent<any>): void {
    const { planningId, conflict } = event.data
    const conflicts = this.state.conflicts.get(planningId) || []
    conflicts.push(conflict)
    this.state.conflicts.set(planningId, conflicts)
    this.notifyStateChange()
  }

  private handleTaskAdded(event: RealtimeEvent<any>): void {
    const { planning, task } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleTaskUpdated(event: RealtimeEvent<any>): void {
    const { planning, task } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleTaskCompleted(event: RealtimeEvent<any>): void {
    const { planning, task } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleTaskDeleted(event: RealtimeEvent<any>): void {
    const { planning } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleCommentAdded(event: RealtimeEvent<any>): void {
    const { planning } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleCommentUpdated(event: RealtimeEvent<any>): void {
    const { planning } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  private handleCommentDeleted(event: RealtimeEvent<any>): void {
    const { planning } = event.data
    this.state.plans.set(planning.id, planning)
    this.notifyStateChange()
  }

  // Saving and persistence
  private scheduleSave(planningId: PlanningId): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = setTimeout(() => {
      this.savePlanning(planningId)
    }, 2000) // Save after 2 seconds of inactivity
  }

  private async savePlanning(planningId: PlanningId): Promise<void> {
    const planning = this.state.plans.get(planningId)
    const session = this.state.sessions.get(planningId)
    
    if (!planning || !session || !session.hasUnsavedChanges) return

    try {
      const response = await fetch(`/api/realtime/planning/${planningId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          planning,
          version: session.version,
        }),
      })

      if (response.ok) {
        session.hasUnsavedChanges = false
        session.lastSaved = new Date().toISOString()
        this.notifyStateChange()
      }
    } catch (error) {
      console.error('[CollaborativePlanningManager] Failed to save planning:', error)
    }
  }

  // Utility methods
  private getUserColor(userId: UserId): string {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  private generatePlanningId(): PlanningId {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getAuthToken(): Promise<string> {
    return 'auth-token'
  }

  // State management
  getState(): PlanningState {
    return { ...this.state }
  }

  subscribe(listener: (state: PlanningState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyStateChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[CollaborativePlanningManager] Listener error:', error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    if (this.cursorUpdateTimer) {
      clearTimeout(this.cursorUpdateTimer)
    }
    
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.state.plans.clear()
    this.state.sessions.clear()
    this.state.operations.clear()
    this.state.conflicts.clear()
    this.state.cursors.clear()
    this.state.snapshots.clear()
    this.operationQueue.clear()
    this.versionVectors.clear()
    this.transformationCache.clear()
    this.listeners.clear()
  }
}

// Factory function
export const createCollaborativePlanningManager = (client: RealtimeClient): CollaborativePlanningManager => {
  return new CollaborativePlanningManager(client)
}