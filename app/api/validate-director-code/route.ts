/**
 * Director Code Validation API
 * 
 * Validates director codes provided by families during onboarding
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Director code is required' },
        { status: 400 }
      )
    }

    // For now, implement basic code validation
    // In production, this would query the database for valid director codes
    const isValidFormat = /^[A-Z]{2,5}-\d{4}-\d{3}$/.test(code)
    
    if (!isValidFormat) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid code format'
      })
    }

    // Mock validation - in production this would check the database
    const mockValidCodes = [
      { code: 'VDB-2024-001', directorName: 'Van der Berg Uitvaarten' },
      { code: 'JAN-2024-002', directorName: 'Jansen & Zonen' },
      { code: 'DELA-2024-003', directorName: 'DELA Uitvaarten' },
      { code: 'WIT-2024-004', directorName: 'De Wit Uitvaartdiensten' }
    ]

    const foundCode = mockValidCodes.find(c => c.code === code)

    if (foundCode) {
      return NextResponse.json({
        valid: true,
        directorName: foundCode.directorName,
        code: foundCode.code
      })
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Code not found or expired'
      })
    }
  } catch (error) {
    console.error('Director code validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}