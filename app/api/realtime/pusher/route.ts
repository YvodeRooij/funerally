/**
 * REAL-TIME API ROUTE - PUSHER INTEGRATION
 * 
 * Purpose: Server-side API for real-time communication via Pusher
 * Features: Message broadcasting, authentication, channel management
 * Architecture: RESTful API with proper error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { PUSHER_CONFIG, CHANNELS, EVENTS } from '@/lib/realtime/config'

// Initialize Pusher server instance
const pusher = new Pusher({
  appId: PUSHER_CONFIG.appId,
  key: PUSHER_CONFIG.key,
  secret: PUSHER_CONFIG.secret,
  cluster: PUSHER_CONFIG.cluster,
  useTLS: PUSHER_CONFIG.useTLS,
})

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface PusherMessage {
  channel: string
  event: string
  data: any
  socket_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token and get user info
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check rate limiting
    const rateLimitKey = `${user.id}_${Math.floor(Date.now() / 60000)}` // Per minute
    const rateLimit = rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: Date.now() + 60000 }
    
    if (rateLimit.count >= 60) { // 60 messages per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    rateLimit.count++
    rateLimitStore.set(rateLimitKey, rateLimit)

    // Parse request body
    const body: PusherMessage = await request.json()
    
    // Validate message structure
    if (!body.channel || !body.event || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, event, data' },
        { status: 400 }
      )
    }

    // Validate channel access
    const hasAccess = await validateChannelAccess(user, body.channel)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to channel' },
        { status: 403 }
      )
    }

    // Process different event types
    let processedData = body.data
    
    switch (body.event) {
      case EVENTS.MESSAGE_SENT:
        processedData = await processMessageEvent(user, body.data)
        break
      case EVENTS.NOTIFICATION_NEW:
        processedData = await processNotificationEvent(user, body.data)
        break
      case EVENTS.USER_ONLINE:
      case EVENTS.USER_OFFLINE:
        processedData = await processPresenceEvent(user, body.data)
        break
      case EVENTS.DOCUMENT_UPLOADED:
        processedData = await processDocumentEvent(user, body.data)
        break
      default:
        // Allow other events to pass through
        break
    }

    // Add metadata
    processedData = {
      ...processedData,
      timestamp: new Date().toISOString(),
      userId: user.id,
      sessionId: request.headers.get('x-session-id'),
    }

    // Trigger the event via Pusher
    await pusher.trigger(body.channel, body.event, processedData, {
      socket_id: body.socket_id, // Exclude sender if provided
    })

    // Store event for audit/history if needed
    await storeEvent({
      channel: body.channel,
      event: body.event,
      data: processedData,
      userId: user.id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Pusher API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Pusher authentication endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const socketId = url.searchParams.get('socket_id')
    const channelName = url.searchParams.get('channel_name')

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      )
    }

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await verifyToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check channel access
    const hasAccess = await validateChannelAccess(user, channelName)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to channel' },
        { status: 403 }
      )
    }

    // Handle different channel types
    if (channelName.startsWith('presence-')) {
      // Presence channel authentication
      const presenceData = {
        user_id: user.id,
        user_info: {
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      }

      const auth = pusher.authorizeChannel(socketId, channelName, presenceData)
      return NextResponse.json(auth)
    } else if (channelName.startsWith('private-')) {
      // Private channel authentication
      const auth = pusher.authorizeChannel(socketId, channelName)
      return NextResponse.json(auth)
    } else {
      // Public channel - no auth needed
      return NextResponse.json({ success: true })
    }

  } catch (error) {
    console.error('[Pusher Auth] Error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Helper functions
async function verifyToken(token: string): Promise<{
  id: string
  name: string
  role: string
  avatar?: string
} | null> {
  try {
    // This would integrate with your authentication system
    // For example, verify JWT token, check with auth service, etc.
    
    // Mock implementation
    if (token === 'user-auth-token') {
      return {
        id: 'user123',
        name: 'Test User',
        role: 'family',
      }
    }
    
    return null
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

async function validateChannelAccess(
  user: { id: string; role: string },
  channelName: string
): Promise<boolean> {
  try {
    // Family-specific channels
    if (channelName.includes('family-notifications-') || 
        channelName.includes('family-documents-') ||
        channelName.includes('family-planning-')) {
      const familyId = extractFamilyIdFromChannel(channelName)
      return await userBelongsToFamily(user.id, familyId)
    }

    // Director-specific channels
    if (channelName.includes('director-notifications-') ||
        channelName.includes('director-clients-')) {
      const directorId = extractDirectorIdFromChannel(channelName)
      return user.id === directorId || user.role === 'admin'
    }

    // Family-director chat channels
    if (channelName.includes('family-director-')) {
      const { familyId, directorId } = extractChatParticipants(channelName)
      return user.id === familyId || user.id === directorId || user.role === 'admin'
    }

    // Venue channels
    if (channelName.includes('venue-')) {
      const venueId = extractVenueIdFromChannel(channelName)
      return await userCanAccessVenue(user.id, venueId)
    }

    // System channels - admin only
    if (channelName.includes('system-')) {
      return user.role === 'admin'
    }

    // Default deny
    return false
  } catch (error) {
    console.error('Channel access validation failed:', error)
    return false
  }
}

async function processMessageEvent(user: any, data: any) {
  // Validate and process chat message
  const processedMessage = {
    ...data,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    timestamp: new Date().toISOString(),
    id: generateMessageId(),
    status: 'sent',
  }

  // Store message in database
  await storeMessage(processedMessage)
  
  // Update last message in chat room
  await updateChatRoomLastMessage(data.chatId, processedMessage)

  return processedMessage
}

async function processNotificationEvent(user: any, data: any) {
  // Validate and process notification
  const processedNotification = {
    ...data,
    id: generateNotificationId(),
    timestamp: new Date().toISOString(),
    read: false,
  }

  // Store notification in database
  await storeNotification(processedNotification)

  // Send via other channels if needed (email, SMS, push)
  await sendMultiChannelNotification(processedNotification)

  return processedNotification
}

async function processPresenceEvent(user: any, data: any) {
  // Update user presence in database
  await updateUserPresence(user.id, {
    status: data.status,
    lastSeen: new Date().toISOString(),
    currentPage: data.currentPage,
  })

  return {
    ...data,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
  }
}

async function processDocumentEvent(user: any, data: any) {
  // Process document upload/update
  const processedDocument = {
    ...data,
    uploadedBy: user.id,
    timestamp: new Date().toISOString(),
  }

  // Update document status in database
  await updateDocumentStatus(data.documentId, processedDocument)

  return processedDocument
}

// Database operations (mock implementations)
async function storeEvent(event: any): Promise<void> {
  // Store event for audit trail
  console.log('Storing event:', event)
}

async function storeMessage(message: any): Promise<void> {
  // Store message in database
  console.log('Storing message:', message)
}

async function updateChatRoomLastMessage(chatId: string, message: any): Promise<void> {
  // Update chat room with last message
  console.log('Updating chat room:', chatId, message)
}

async function storeNotification(notification: any): Promise<void> {
  // Store notification in database
  console.log('Storing notification:', notification)
}

async function sendMultiChannelNotification(notification: any): Promise<void> {
  // Send notification via email, SMS, push, etc.
  console.log('Sending multi-channel notification:', notification)
}

async function updateUserPresence(userId: string, presence: any): Promise<void> {
  // Update user presence in database
  console.log('Updating presence:', userId, presence)
}

async function updateDocumentStatus(documentId: string, data: any): Promise<void> {
  // Update document in database
  console.log('Updating document:', documentId, data)
}

async function userBelongsToFamily(userId: string, familyId: string): Promise<boolean> {
  // Check if user belongs to family
  return true // Mock implementation
}

async function userCanAccessVenue(userId: string, venueId: string): Promise<boolean> {
  // Check if user can access venue
  return true // Mock implementation
}

// Utility functions
function extractFamilyIdFromChannel(channelName: string): string {
  const match = channelName.match(/family-[^-]+-(.+)/)
  return match ? match[1] : ''
}

function extractDirectorIdFromChannel(channelName: string): string {
  const match = channelName.match(/director-[^-]+-(.+)/)
  return match ? match[1] : ''
}

function extractChatParticipants(channelName: string): { familyId: string; directorId: string } {
  const match = channelName.match(/family-director-(.+)-(.+)/)
  return {
    familyId: match ? match[1] : '',
    directorId: match ? match[2] : '',
  }
}

function extractVenueIdFromChannel(channelName: string): string {
  const match = channelName.match(/venue-[^-]+-(.+)/)
  return match ? match[1] : ''
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}