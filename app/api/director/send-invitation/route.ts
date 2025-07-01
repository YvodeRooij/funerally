/**
 * Director Invitation Email API
 * 
 * Handles sending invitation emails to families with their unique codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { directorCodeService } from '@/lib/services/director-code-service'

interface SendInvitationRequest {
  familyName: string
  primaryContact: string
  email: string
  phone: string
  municipality?: string
  expectedDate?: string
  personalNote?: string
  directorId: string
  directorName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendInvitationRequest = await request.json()
    
    // Validate required fields
    const requiredFields = ['familyName', 'primaryContact', 'email', 'phone', 'directorId', 'directorName']
    for (const field of requiredFields) {
      if (!body[field as keyof SendInvitationRequest]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create director code
    const directorCode = await directorCodeService.createDirectorCode({
      familyName: body.familyName,
      primaryContact: body.primaryContact,
      email: body.email,
      phone: body.phone,
      municipality: body.municipality,
      expectedDate: body.expectedDate,
      personalNote: body.personalNote,
      directorId: body.directorId
    })

    // Generate email content
    const emailContent = directorCodeService.generateInvitationEmail(
      directorCode, 
      body.directorName
    )

    // Send email (in production, integrate with email service)
    const emailResult = await sendEmail(emailContent)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        invitationId: directorCode.id,
        code: directorCode.code,
        emailSent: true,
        recipientEmail: body.email,
        expiresAt: directorCode.expiresAt
      }
    })

  } catch (error) {
    console.error('Send invitation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Mock email sending service
 * In production, integrate with SendGrid, Mailgun, AWS SES, etc.
 */
async function sendEmail(emailContent: {
  subject: string
  htmlBody: string
  textBody: string
  recipientEmail: string
  recipientName: string
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  
  try {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock email service response
    const mockResponse = {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    console.log('📧 Email sent (mock):', {
      to: emailContent.recipientEmail,
      subject: emailContent.subject,
      messageId: mockResponse.messageId
    })

    // In production, replace with actual email service:
    /*
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ 
            email: emailContent.recipientEmail, 
            name: emailContent.recipientName 
          }]
        }],
        from: { 
          email: 'director@farewelly.nl', 
          name: 'farewelly Uitvaartdiensten' 
        },
        subject: emailContent.subject,
        content: [
          {
            type: 'text/html',
            value: emailContent.htmlBody
          },
          {
            type: 'text/plain',
            value: emailContent.textBody
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`)
    }
    */

    return mockResponse

  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

/**
 * GET endpoint to retrieve invitation status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const directorId = searchParams.get('directorId')

  if (!directorId) {
    return NextResponse.json(
      { error: 'Missing directorId parameter' },
      { status: 400 }
    )
  }

  try {
    const invitations = await directorCodeService.getPendingInvitations(directorId)
    
    return NextResponse.json({
      success: true,
      data: {
        invitations,
        totalPending: invitations.filter(inv => inv.status === 'pending').length,
        totalConnected: invitations.filter(inv => inv.status === 'connected').length
      }
    })

  } catch (error) {
    console.error('Get invitations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}