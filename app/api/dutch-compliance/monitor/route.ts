/**
 * Dutch Legal Compliance Monitoring API
 * 
 * Controls the background monitoring service for Dutch legal compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { dutchComplianceMonitor } from '@/lib/services/dutch-compliance-monitor'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        return handleGetStatus()
      
      case 'check':
        return handlePerformCheck()
      
      default:
        return handleGetStatus()
    }
  } catch (error) {
    console.error('Monitor API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'start':
        return handleStart()
      
      case 'stop':
        return handleStop()
      
      case 'restart':
        return handleRestart()
      
      case 'configure':
        return handleConfigure(config)
      
      case 'manual_check':
        return handleManualCheck()
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Monitor API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get monitoring service status
 */
async function handleGetStatus() {
  try {
    const status = dutchComplianceMonitor.getStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        monitoring: status,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting monitor status:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    )
  }
}

/**
 * Start monitoring service
 */
async function handleStart() {
  try {
    dutchComplianceMonitor.start()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Dutch compliance monitoring started',
        status: dutchComplianceMonitor.getStatus()
      }
    })
  } catch (error) {
    console.error('Error starting monitor:', error)
    return NextResponse.json(
      { error: 'Failed to start monitoring service' },
      { status: 500 }
    )
  }
}

/**
 * Stop monitoring service
 */
async function handleStop() {
  try {
    dutchComplianceMonitor.stop()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Dutch compliance monitoring stopped',
        status: dutchComplianceMonitor.getStatus()
      }
    })
  } catch (error) {
    console.error('Error stopping monitor:', error)
    return NextResponse.json(
      { error: 'Failed to stop monitoring service' },
      { status: 500 }
    )
  }
}

/**
 * Restart monitoring service
 */
async function handleRestart() {
  try {
    dutchComplianceMonitor.stop()
    
    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    dutchComplianceMonitor.start()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Dutch compliance monitoring restarted',
        status: dutchComplianceMonitor.getStatus()
      }
    })
  } catch (error) {
    console.error('Error restarting monitor:', error)
    return NextResponse.json(
      { error: 'Failed to restart monitoring service' },
      { status: 500 }
    )
  }
}

/**
 * Configure monitoring service
 */
async function handleConfigure(config: any) {
  try {
    // TODO: Implement configuration updates
    console.log('Updating monitor configuration:', config)
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Monitor configuration updated',
        config
      }
    })
  } catch (error) {
    console.error('Error configuring monitor:', error)
    return NextResponse.json(
      { error: 'Failed to configure monitoring service' },
      { status: 500 }
    )
  }
}

/**
 * Perform manual monitoring check
 */
async function handleManualCheck() {
  try {
    console.log('Performing manual compliance check...')
    
    await dutchComplianceMonitor.performMonitoringCheck()
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Manual compliance check completed',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error performing manual check:', error)
    return NextResponse.json(
      { error: 'Failed to perform manual check' },
      { status: 500 }
    )
  }
}

/**
 * Trigger monitoring check (alias for manual_check)
 */
async function handlePerformCheck() {
  return handleManualCheck()
}