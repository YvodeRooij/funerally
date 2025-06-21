/**
 * REAL-TIME DOCUMENT SHARING SYSTEM - COLLABORATIVE REVIEW & VERSION CONTROL
 * 
 * Purpose: Comprehensive document sharing with real-time collaboration and review
 * Features: Version control, collaborative review, real-time annotations, access control
 * Architecture: Event-driven system with conflict resolution and audit trails
 */

'use client'

import { 
  DocumentInfo, 
  DocumentId, 
  UserId, 
  FamilyId, 
  DirectorId,
  RealtimeEvent 
} from './types'
import { CHANNELS, EVENTS, FEATURE_FLAGS } from './config'
import { RealtimeClient } from './client'

export interface DocumentVersion {
  id: string
  documentId: DocumentId
  version: number
  url: string
  size: number
  checksum: string
  changes: string[]
  createdBy: UserId
  createdAt: string
  metadata: {
    fileName: string
    mimeType: string
    pages?: number
    duration?: number // for audio/video
    dimensions?: { width: number, height: number } // for images
  }
}

export interface DocumentAnnotation {
  id: string
  documentId: DocumentId
  version: number
  type: 'comment' | 'highlight' | 'drawing' | 'stamp' | 'signature'
  position: {
    page?: number
    x: number
    y: number
    width?: number
    height?: number
  }
  content: string
  author: {
    userId: UserId
    userName: string
    role: string
  }
  timestamp: string
  resolved: boolean
  replies?: DocumentAnnotationReply[]
  style?: {
    color: string
    fontSize?: number
    fontFamily?: string
    strokeWidth?: number
  }
}

export interface DocumentAnnotationReply {
  id: string
  content: string
  author: {
    userId: UserId
    userName: string
  }
  timestamp: string
}

export interface DocumentReview {
  id: string
  documentId: DocumentId
  reviewerId: UserId
  reviewerName: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_changes'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: string
  startedAt?: string
  completedAt?: string
  comments: string
  annotations: DocumentAnnotation[]
  checklist?: Array<{
    id: string
    item: string
    checked: boolean
    required: boolean
  }>
}

export interface DocumentAccess {
  userId: UserId
  userName: string
  role: string
  permissions: {
    view: boolean
    download: boolean
    comment: boolean
    edit: boolean
    approve: boolean
    share: boolean
  }
  grantedBy: UserId
  grantedAt: string
  expiresAt?: string
}

export interface DocumentSession {
  id: string
  documentId: DocumentId
  viewers: Array<{
    userId: UserId
    userName: string
    joinedAt: string
    currentPage?: number
    lastActivity: string
    cursor?: {
      x: number
      y: number
      page?: number
    }
  }>
  collaborativeMode: boolean
  lockStatus: {
    isLocked: boolean
    lockedBy?: UserId
    lockedAt?: string
    reason?: string
  }
}

export interface DocumentActivity {
  id: string
  documentId: DocumentId
  userId: UserId
  userName: string
  action: 'viewed' | 'downloaded' | 'uploaded' | 'shared' | 'commented' | 'approved' | 'rejected' | 'edited'
  timestamp: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface DocumentState {
  documents: Map<DocumentId, DocumentInfo>
  versions: Map<DocumentId, DocumentVersion[]>
  annotations: Map<DocumentId, Map<number, DocumentAnnotation[]>> // version -> annotations
  reviews: Map<DocumentId, DocumentReview[]>
  access: Map<DocumentId, DocumentAccess[]>
  sessions: Map<DocumentId, DocumentSession>
  activities: Map<DocumentId, DocumentActivity[]>
  loading: Map<DocumentId, boolean>
  error?: string
}

export class DocumentSharingManager {
  private client: RealtimeClient
  private state: DocumentState
  private viewerHeartbeat = new Map<DocumentId, NodeJS.Timeout>()
  private annotationBuffer = new Map<DocumentId, DocumentAnnotation[]>()
  private saveTimer?: NodeJS.Timeout
  private listeners = new Set<(state: DocumentState) => void>()

  constructor(client: RealtimeClient) {
    this.client = client
    this.state = {
      documents: new Map(),
      versions: new Map(),
      annotations: new Map(),
      reviews: new Map(),
      access: new Map(),
      sessions: new Map(),
      activities: new Map(),
      loading: new Map(),
    }
    
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Document events
    this.client.on('document:uploaded', this.handleDocumentUploaded.bind(this))
    this.client.on('document:updated', this.handleDocumentUpdated.bind(this))
    this.client.on('document:shared', this.handleDocumentShared.bind(this))
    this.client.on('document:reviewed', this.handleDocumentReviewed.bind(this))
    
    // Version events
    this.client.on('document:version:created', this.handleVersionCreated.bind(this))
    
    // Annotation events
    this.client.on('document:annotation:added', this.handleAnnotationAdded.bind(this))
    this.client.on('document:annotation:updated', this.handleAnnotationUpdated.bind(this))
    this.client.on('document:annotation:deleted', this.handleAnnotationDeleted.bind(this))
    this.client.on('document:annotation:resolved', this.handleAnnotationResolved.bind(this))
    
    // Session events
    this.client.on('document:viewer:joined', this.handleViewerJoined.bind(this))
    this.client.on('document:viewer:left', this.handleViewerLeft.bind(this))
    this.client.on('document:cursor:moved', this.handleCursorMoved.bind(this))
    
    // Review events
    this.client.on('document:review:started', this.handleReviewStarted.bind(this))
    this.client.on('document:review:completed', this.handleReviewCompleted.bind(this))
    
    // Access events
    this.client.on('document:access:granted', this.handleAccessGranted.bind(this))
    this.client.on('document:access:revoked', this.handleAccessRevoked.bind(this))
  }

  // Document management
  async uploadDocument(
    file: File,
    category: DocumentInfo['category'],
    familyId?: FamilyId,
    metadata: Partial<DocumentInfo> = {}
  ): Promise<DocumentInfo> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) throw new Error('User not authenticated')

    const documentId = this.generateDocumentId()
    
    // Create initial document info
    const document: DocumentInfo = {
      id: documentId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: '', // Will be set after upload
      uploadedBy: currentUser.userId,
      uploadedAt: new Date().toISOString(),
      category,
      status: 'pending',
      sharedWith: familyId ? [familyId] : [],
      version: 1,
      tags: metadata.tags || [],
      ...metadata,
    }

    this.state.documents.set(documentId, document)
    this.state.loading.set(documentId, true)

    try {
      // Upload file
      const uploadResult = await this.uploadFile(file, documentId)
      
      // Update document with upload result
      document.url = uploadResult.url
      document.thumbnailUrl = uploadResult.thumbnailUrl
      document.status = 'processing'

      // Create initial version
      const version: DocumentVersion = {
        id: this.generateVersionId(),
        documentId,
        version: 1,
        url: uploadResult.url,
        size: file.size,
        checksum: uploadResult.checksum || '',
        changes: ['Initial upload'],
        createdBy: currentUser.userId,
        createdAt: new Date().toISOString(),
        metadata: {
          fileName: file.name,
          mimeType: file.type,
          ...uploadResult.metadata,
        },
      }

      this.state.versions.set(documentId, [version])
      this.state.annotations.set(documentId, new Map())

      // Create default access for uploader
      const access: DocumentAccess = {
        userId: currentUser.userId,
        userName: currentUser.userName,
        role: 'owner',
        permissions: {
          view: true,
          download: true,
          comment: true,
          edit: true,
          approve: true,
          share: true,
        },
        grantedBy: currentUser.userId,
        grantedAt: new Date().toISOString(),
      }

      this.state.access.set(documentId, [access])

      // Save to server
      await this.saveDocument(document)
      
      // Subscribe to document channel
      this.subscribeToDocument(documentId)
      
      // Announce upload
      await this.announceDocumentEvent(documentId, 'uploaded', { document })
      
      document.status = 'approved' // Or 'pending' based on category
      
    } catch (error) {
      document.status = 'rejected'
      this.state.error = `Upload failed: ${error}`
      throw error
    } finally {
      this.state.loading.set(documentId, false)
      this.notifyStateChange()
    }

    return document
  }

  private async uploadFile(file: File, documentId: DocumentId): Promise<{
    url: string
    thumbnailUrl?: string
    checksum?: string
    metadata?: Record<string, any>
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentId', documentId)

    const response = await fetch('/api/realtime/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async shareDocument(
    documentId: DocumentId,
    recipients: Array<{
      userId: UserId
      permissions: Partial<DocumentAccess['permissions']>
      expiresAt?: string
    }>
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) throw new Error('User not authenticated')

    const document = this.state.documents.get(documentId)
    if (!document) throw new Error('Document not found')

    // Check permissions
    if (!this.hasPermission(documentId, currentUser.userId, 'share')) {
      throw new Error('Insufficient permissions to share document')
    }

    const currentAccess = this.state.access.get(documentId) || []
    
    for (const recipient of recipients) {
      const access: DocumentAccess = {
        userId: recipient.userId,
        userName: await this.getUserName(recipient.userId),
        role: 'viewer',
        permissions: {
          view: true,
          download: false,
          comment: false,
          edit: false,
          approve: false,
          share: false,
          ...recipient.permissions,
        },
        grantedBy: currentUser.userId,
        grantedAt: new Date().toISOString(),
        expiresAt: recipient.expiresAt,
      }

      // Remove existing access for this user
      const filteredAccess = currentAccess.filter(a => a.userId !== recipient.userId)
      filteredAccess.push(access)
      
      this.state.access.set(documentId, filteredAccess)
      
      // Update document shared list
      if (!document.sharedWith.includes(recipient.userId)) {
        document.sharedWith.push(recipient.userId)
      }
    }

    // Save changes
    await this.saveDocument(document)
    await this.saveDocumentAccess(documentId)
    
    // Announce sharing
    await this.announceDocumentEvent(documentId, 'shared', {
      document,
      recipients: recipients.map(r => r.userId),
      sharedBy: currentUser.userId,
    })

    this.notifyStateChange()
  }

  // Annotation management
  async addAnnotation(
    documentId: DocumentId,
    version: number,
    annotation: Omit<DocumentAnnotation, 'id' | 'author' | 'timestamp' | 'resolved'>
  ): Promise<DocumentAnnotation> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) throw new Error('User not authenticated')

    if (!this.hasPermission(documentId, currentUser.userId, 'comment')) {
      throw new Error('Insufficient permissions to add annotation')
    }

    const fullAnnotation: DocumentAnnotation = {
      ...annotation,
      id: this.generateAnnotationId(),
      author: {
        userId: currentUser.userId,
        userName: currentUser.userName,
        role: currentUser.userRole,
      },
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    }

    // Add to local state
    const versionAnnotations = this.state.annotations.get(documentId) || new Map()
    const annotations = versionAnnotations.get(version) || []
    annotations.push(fullAnnotation)
    versionAnnotations.set(version, annotations)
    this.state.annotations.set(documentId, versionAnnotations)

    // Buffer for batch saving
    const buffer = this.annotationBuffer.get(documentId) || []
    buffer.push(fullAnnotation)
    this.annotationBuffer.set(documentId, buffer)

    this.scheduleSave()

    // Announce annotation
    await this.announceDocumentEvent(documentId, 'annotation:added', {
      annotation: fullAnnotation,
      version,
    })

    this.notifyStateChange()
    return fullAnnotation
  }

  async updateAnnotation(
    documentId: DocumentId,
    annotationId: string,
    updates: Partial<DocumentAnnotation>
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const versionAnnotations = this.state.annotations.get(documentId)
    if (!versionAnnotations) return

    // Find and update annotation
    for (const [version, annotations] of versionAnnotations) {
      const annotationIndex = annotations.findIndex(a => a.id === annotationId)
      if (annotationIndex !== -1) {
        const annotation = annotations[annotationIndex]
        
        // Check if user can edit this annotation
        if (annotation.author.userId !== currentUser.userId && 
            !this.hasPermission(documentId, currentUser.userId, 'edit')) {
          throw new Error('Insufficient permissions to edit annotation')
        }

        Object.assign(annotation, updates)
        
        // Announce update
        await this.announceDocumentEvent(documentId, 'annotation:updated', {
          annotation,
          updates,
        })
        
        this.notifyStateChange()
        break
      }
    }
  }

  async replyToAnnotation(
    documentId: DocumentId,
    annotationId: string,
    content: string
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const reply: DocumentAnnotationReply = {
      id: this.generateReplyId(),
      content,
      author: {
        userId: currentUser.userId,
        userName: currentUser.userName,
      },
      timestamp: new Date().toISOString(),
    }

    const versionAnnotations = this.state.annotations.get(documentId)
    if (!versionAnnotations) return

    // Find and update annotation
    for (const [version, annotations] of versionAnnotations) {
      const annotation = annotations.find(a => a.id === annotationId)
      if (annotation) {
        annotation.replies = annotation.replies || []
        annotation.replies.push(reply)
        
        await this.announceDocumentEvent(documentId, 'annotation:reply:added', {
          annotationId,
          reply,
        })
        
        this.notifyStateChange()
        break
      }
    }
  }

  async resolveAnnotation(documentId: DocumentId, annotationId: string): Promise<void> {
    await this.updateAnnotation(documentId, annotationId, { resolved: true })
  }

  // Review management
  async startReview(
    documentId: DocumentId,
    reviewerId: UserId,
    priority: DocumentReview['priority'] = 'medium',
    deadline?: string
  ): Promise<DocumentReview> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) throw new Error('User not authenticated')

    if (!this.hasPermission(documentId, currentUser.userId, 'approve')) {
      throw new Error('Insufficient permissions to start review')
    }

    const review: DocumentReview = {
      id: this.generateReviewId(),
      documentId,
      reviewerId,
      reviewerName: await this.getUserName(reviewerId),
      status: 'pending',
      priority,
      deadline,
      startedAt: new Date().toISOString(),
      comments: '',
      annotations: [],
    }

    const reviews = this.state.reviews.get(documentId) || []
    reviews.push(review)
    this.state.reviews.set(documentId, reviews)

    // Save to server
    await this.saveDocumentReview(review)

    // Announce review
    await this.announceDocumentEvent(documentId, 'review:started', { review })

    this.notifyStateChange()
    return review
  }

  async completeReview(
    documentId: DocumentId,
    reviewId: string,
    status: 'approved' | 'rejected' | 'requires_changes',
    comments: string,
    checklist?: DocumentReview['checklist']
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const reviews = this.state.reviews.get(documentId) || []
    const review = reviews.find(r => r.id === reviewId)
    
    if (!review) throw new Error('Review not found')
    if (review.reviewerId !== currentUser.userId) {
      throw new Error('Only the assigned reviewer can complete this review')
    }

    review.status = status
    review.comments = comments
    review.completedAt = new Date().toISOString()
    review.checklist = checklist

    // Update document status based on review
    const document = this.state.documents.get(documentId)
    if (document) {
      document.status = status === 'approved' ? 'approved' : 'rejected'
    }

    // Save changes
    await this.saveDocumentReview(review)
    if (document) {
      await this.saveDocument(document)
    }

    // Announce completion
    await this.announceDocumentEvent(documentId, 'review:completed', {
      review,
      status,
    })

    this.notifyStateChange()
  }

  // Viewing and sessions
  async joinDocument(documentId: DocumentId): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    if (!this.hasPermission(documentId, currentUser.userId, 'view')) {
      throw new Error('Insufficient permissions to view document')
    }

    // Load document data
    await this.loadDocument(documentId)
    
    // Subscribe to document channel
    this.subscribeToDocument(documentId)
    
    // Join viewing session
    await this.joinViewingSession(documentId)
    
    // Track activity
    await this.trackActivity(documentId, 'viewed')
  }

  private async loadDocument(documentId: DocumentId): Promise<void> {
    this.state.loading.set(documentId, true)

    try {
      const response = await fetch(`/api/realtime/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`)
      }

      const data = await response.json()
      
      this.state.documents.set(documentId, data.document)
      this.state.versions.set(documentId, data.versions || [])
      this.state.access.set(documentId, data.access || [])
      this.state.reviews.set(documentId, data.reviews || [])
      
      // Load annotations by version
      const annotationsByVersion = new Map<number, DocumentAnnotation[]>()
      if (data.annotations) {
        data.annotations.forEach((annotation: DocumentAnnotation) => {
          const versionAnnotations = annotationsByVersion.get(annotation.version) || []
          versionAnnotations.push(annotation)
          annotationsByVersion.set(annotation.version, versionAnnotations)
        })
      }
      this.state.annotations.set(documentId, annotationsByVersion)
      
    } catch (error) {
      this.state.error = `Failed to load document: ${error}`
      throw error
    } finally {
      this.state.loading.set(documentId, false)
      this.notifyStateChange()
    }
  }

  private subscribeToDocument(documentId: DocumentId): void {
    const channel = CHANNELS.FAMILY_DOCUMENTS(documentId)
    
    this.client.subscribe(channel, [
      'document:updated',
      'document:shared',
      'document:reviewed',
      'document:version:created',
      'document:annotation:added',
      'document:annotation:updated',
      'document:annotation:deleted',
      'document:annotation:resolved',
      'document:viewer:joined',
      'document:viewer:left',
      'document:cursor:moved',
      'document:review:started',
      'document:review:completed',
      'document:access:granted',
      'document:access:revoked',
    ])
  }

  private async joinViewingSession(documentId: DocumentId): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    let session = this.state.sessions.get(documentId)
    
    if (!session) {
      session = {
        id: this.generateSessionId(),
        documentId,
        viewers: [],
        collaborativeMode: FEATURE_FLAGS.ENABLE_COLLABORATIVE_EDITING,
        lockStatus: { isLocked: false },
      }
      this.state.sessions.set(documentId, session)
    }

    // Add user to viewers
    const existingViewer = session.viewers.find(v => v.userId === currentUser.userId)
    if (!existingViewer) {
      session.viewers.push({
        userId: currentUser.userId,
        userName: currentUser.userName,
        joinedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      })

      // Start heartbeat
      this.startViewerHeartbeat(documentId)

      // Announce joining
      await this.announceDocumentEvent(documentId, 'viewer:joined', {
        userId: currentUser.userId,
        userName: currentUser.userName,
      })
    }
  }

  private startViewerHeartbeat(documentId: DocumentId): void {
    const timer = setInterval(async () => {
      await this.sendViewerHeartbeat(documentId)
    }, 30000) // Every 30 seconds

    this.viewerHeartbeat.set(documentId, timer)
  }

  private async sendViewerHeartbeat(documentId: DocumentId): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const session = this.state.sessions.get(documentId)
    if (!session) return

    const viewer = session.viewers.find(v => v.userId === currentUser.userId)
    if (viewer) {
      viewer.lastActivity = new Date().toISOString()
      
      await this.announceDocumentEvent(documentId, 'viewer:heartbeat', {
        userId: currentUser.userId,
        lastActivity: viewer.lastActivity,
      })
    }
  }

  async updateCursor(
    documentId: DocumentId,
    x: number,
    y: number,
    page?: number
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const session = this.state.sessions.get(documentId)
    if (!session || !session.collaborativeMode) return

    const viewer = session.viewers.find(v => v.userId === currentUser.userId)
    if (viewer) {
      viewer.cursor = { x, y, page }
      viewer.currentPage = page
      viewer.lastActivity = new Date().toISOString()

      // Throttled cursor updates
      await this.announceDocumentEvent(documentId, 'cursor:moved', {
        userId: currentUser.userId,
        cursor: viewer.cursor,
        page,
      })
    }
  }

  // Permission management
  private hasPermission(
    documentId: DocumentId,
    userId: UserId,
    permission: keyof DocumentAccess['permissions']
  ): boolean {
    const accessList = this.state.access.get(documentId) || []
    const userAccess = accessList.find(a => a.userId === userId)
    
    if (!userAccess) return false
    if (userAccess.expiresAt && new Date(userAccess.expiresAt) < new Date()) return false
    
    return userAccess.permissions[permission]
  }

  // Activity tracking
  private async trackActivity(
    documentId: DocumentId,
    action: DocumentActivity['action'],
    metadata?: Record<string, any>
  ): Promise<void> {
    const currentUser = this.client.getState().presence.currentUser
    if (!currentUser) return

    const activity: DocumentActivity = {
      id: this.generateActivityId(),
      documentId,
      userId: currentUser.userId,
      userName: currentUser.userName,
      action,
      timestamp: new Date().toISOString(),
      metadata,
    }

    const activities = this.state.activities.get(documentId) || []
    activities.unshift(activity)
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(100)
    }
    
    this.state.activities.set(documentId, activities)

    // Send to server
    try {
      await fetch('/api/realtime/documents/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(activity),
      })
    } catch (error) {
      console.error('[DocumentSharingManager] Failed to track activity:', error)
    }
  }

  // Event handlers
  private handleDocumentUploaded(event: RealtimeEvent<any>): void {
    const { document } = event.data
    this.state.documents.set(document.id, document)
    this.notifyStateChange()
  }

  private handleDocumentUpdated(event: RealtimeEvent<any>): void {
    const { document } = event.data
    this.state.documents.set(document.id, document)
    this.notifyStateChange()
  }

  private handleDocumentShared(event: RealtimeEvent<any>): void {
    const { document, recipients } = event.data
    this.state.documents.set(document.id, document)
    this.notifyStateChange()
  }

  private handleDocumentReviewed(event: RealtimeEvent<any>): void {
    const { document, review } = event.data
    this.state.documents.set(document.id, document)
    
    const reviews = this.state.reviews.get(document.id) || []
    const existingIndex = reviews.findIndex(r => r.id === review.id)
    if (existingIndex !== -1) {
      reviews[existingIndex] = review
    } else {
      reviews.push(review)
    }
    this.state.reviews.set(document.id, reviews)
    
    this.notifyStateChange()
  }

  private handleVersionCreated(event: RealtimeEvent<any>): void {
    const { documentId, version } = event.data
    const versions = this.state.versions.get(documentId) || []
    versions.push(version)
    this.state.versions.set(documentId, versions)
    this.notifyStateChange()
  }

  private handleAnnotationAdded(event: RealtimeEvent<any>): void {
    const { annotation, version } = event.data
    const versionAnnotations = this.state.annotations.get(annotation.documentId) || new Map()
    const annotations = versionAnnotations.get(version) || []
    annotations.push(annotation)
    versionAnnotations.set(version, annotations)
    this.state.annotations.set(annotation.documentId, versionAnnotations)
    this.notifyStateChange()
  }

  private handleAnnotationUpdated(event: RealtimeEvent<any>): void {
    const { annotation } = event.data
    const versionAnnotations = this.state.annotations.get(annotation.documentId)
    if (!versionAnnotations) return

    for (const [version, annotations] of versionAnnotations) {
      const index = annotations.findIndex(a => a.id === annotation.id)
      if (index !== -1) {
        annotations[index] = annotation
        this.notifyStateChange()
        break
      }
    }
  }

  private handleAnnotationDeleted(event: RealtimeEvent<any>): void {
    const { documentId, annotationId } = event.data
    const versionAnnotations = this.state.annotations.get(documentId)
    if (!versionAnnotations) return

    for (const [version, annotations] of versionAnnotations) {
      const index = annotations.findIndex(a => a.id === annotationId)
      if (index !== -1) {
        annotations.splice(index, 1)
        this.notifyStateChange()
        break
      }
    }
  }

  private handleAnnotationResolved(event: RealtimeEvent<any>): void {
    const { documentId, annotationId } = event.data
    const versionAnnotations = this.state.annotations.get(documentId)
    if (!versionAnnotations) return

    for (const [version, annotations] of versionAnnotations) {
      const annotation = annotations.find(a => a.id === annotationId)
      if (annotation) {
        annotation.resolved = true
        this.notifyStateChange()
        break
      }
    }
  }

  private handleViewerJoined(event: RealtimeEvent<any>): void {
    const { documentId, userId, userName } = event.data
    const session = this.state.sessions.get(documentId)
    
    if (session && !session.viewers.find(v => v.userId === userId)) {
      session.viewers.push({
        userId,
        userName,
        joinedAt: event.timestamp,
        lastActivity: event.timestamp,
      })
      this.notifyStateChange()
    }
  }

  private handleViewerLeft(event: RealtimeEvent<any>): void {
    const { documentId, userId } = event.data
    const session = this.state.sessions.get(documentId)
    
    if (session) {
      session.viewers = session.viewers.filter(v => v.userId !== userId)
      this.notifyStateChange()
    }
  }

  private handleCursorMoved(event: RealtimeEvent<any>): void {
    const { documentId, userId, cursor } = event.data
    const session = this.state.sessions.get(documentId)
    
    if (session) {
      const viewer = session.viewers.find(v => v.userId === userId)
      if (viewer) {
        viewer.cursor = cursor
        viewer.lastActivity = event.timestamp
        this.notifyStateChange()
      }
    }
  }

  private handleReviewStarted(event: RealtimeEvent<any>): void {
    const { review } = event.data
    const reviews = this.state.reviews.get(review.documentId) || []
    reviews.push(review)
    this.state.reviews.set(review.documentId, reviews)
    this.notifyStateChange()
  }

  private handleReviewCompleted(event: RealtimeEvent<any>): void {
    const { review } = event.data
    const reviews = this.state.reviews.get(review.documentId) || []
    const index = reviews.findIndex(r => r.id === review.id)
    if (index !== -1) {
      reviews[index] = review
      this.notifyStateChange()
    }
  }

  private handleAccessGranted(event: RealtimeEvent<any>): void {
    const { documentId, access } = event.data
    const accessList = this.state.access.get(documentId) || []
    accessList.push(access)
    this.state.access.set(documentId, accessList)
    this.notifyStateChange()
  }

  private handleAccessRevoked(event: RealtimeEvent<any>): void {
    const { documentId, userId } = event.data
    const accessList = this.state.access.get(documentId) || []
    const filtered = accessList.filter(a => a.userId !== userId)
    this.state.access.set(documentId, filtered)
    this.notifyStateChange()
  }

  // Persistence
  private scheduleSave(): void {
    if (this.saveTimer) return

    this.saveTimer = setTimeout(async () => {
      await this.saveBufferedAnnotations()
      this.saveTimer = undefined
    }, 2000)
  }

  private async saveBufferedAnnotations(): Promise<void> {
    for (const [documentId, annotations] of this.annotationBuffer) {
      try {
        await fetch('/api/realtime/documents/annotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
          body: JSON.stringify({
            documentId,
            annotations,
          }),
        })
      } catch (error) {
        console.error('[DocumentSharingManager] Failed to save annotations:', error)
      }
    }
    
    this.annotationBuffer.clear()
  }

  private async saveDocument(document: DocumentInfo): Promise<void> {
    await fetch('/api/realtime/documents', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(document),
    })
  }

  private async saveDocumentAccess(documentId: DocumentId): Promise<void> {
    const access = this.state.access.get(documentId) || []
    
    await fetch(`/api/realtime/documents/${documentId}/access`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify({ access }),
    })
  }

  private async saveDocumentReview(review: DocumentReview): Promise<void> {
    await fetch('/api/realtime/documents/reviews', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`,
      },
      body: JSON.stringify(review),
    })
  }

  private async announceDocumentEvent(
    documentId: DocumentId,
    event: string,
    data: any
  ): Promise<void> {
    try {
      await fetch('/api/realtime/documents/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          documentId,
          event,
          data,
        }),
      })
    } catch (error) {
      console.error('[DocumentSharingManager] Failed to announce event:', error)
    }
  }

  // Utility methods
  private async getUserName(userId: UserId): Promise<string> {
    // This would integrate with your user system
    return 'User'
  }

  private generateDocumentId(): DocumentId {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAnnotationId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReplyId(): string {
    return `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReviewId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getAuthToken(): Promise<string> {
    return 'auth-token'
  }

  // State management
  getState(): DocumentState {
    return { ...this.state }
  }

  subscribe(listener: (state: DocumentState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyStateChange(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[DocumentSharingManager] Listener error:', error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.viewerHeartbeat.forEach(timer => clearTimeout(timer))
    this.viewerHeartbeat.clear()

    this.state.documents.clear()
    this.state.versions.clear()
    this.state.annotations.clear()
    this.state.reviews.clear()
    this.state.access.clear()
    this.state.sessions.clear()
    this.state.activities.clear()
    this.annotationBuffer.clear()
    this.listeners.clear()
  }
}

// Factory function
export const createDocumentSharingManager = (client: RealtimeClient): DocumentSharingManager => {
  return new DocumentSharingManager(client)
}