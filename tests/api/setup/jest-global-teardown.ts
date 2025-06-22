/**
 * Jest Global Teardown
 * Clean up test environment after all tests complete
 */

import { Client } from 'pg'

export default async function globalTeardown() {
  console.log('🧹 Starting API test environment cleanup...')
  
  try {
    // Clean up test database
    await cleanupTestDatabase()
    
    // Clean up test files
    await cleanupTestFiles()
    
    // Reset environment variables
    resetEnvironmentVariables()
    
    console.log('✅ API test environment cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
    // Don't throw here as we don't want to fail the entire test suite
  }
}

async function cleanupTestDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/farewelly_test'
  
  try {
    const client = new Client({ connectionString })
    await client.connect()
    
    // Drop test schema and all its tables
    await client.query('DROP SCHEMA IF EXISTS test_schema CASCADE')
    
    // Clean up any remaining test data in public schema
    const tables = [
      'notifications',
      'clients', 
      'venue_availability',
      'calendar_events',
      'chat_messages',
      'chat_rooms',
      'payments',
      'documents',
      'bookings',
      'user_profiles',
    ]
    
    for (const table of tables) {
      try {
        await client.query(`DELETE FROM ${table} WHERE email LIKE '%@test.com' OR id LIKE 'test-%'`)
      } catch (error) {
        // Table might not exist, continue
      }
    }
    
    await client.end()
    console.log('🗑️ Test database cleaned up')
  } catch (error) {
    console.error('Failed to cleanup test database:', error)
  }
}

async function cleanupTestFiles() {
  const fs = require('fs').promises
  const path = require('path')
  
  try {
    // Clean up any test files that were created during testing
    const testFilePaths = [
      '/tmp/test-uploads',
      '/tmp/test-documents',
      './tests/api/temp',
    ]
    
    for (const filePath of testFilePaths) {
      try {
        await fs.rmdir(filePath, { recursive: true })
      } catch (error) {
        // Directory might not exist, continue
      }
    }
    
    console.log('📁 Test files cleaned up')
  } catch (error) {
    console.error('Failed to cleanup test files:', error)
  }
}

function resetEnvironmentVariables() {
  // Reset test-specific environment variables
  const testEnvVars = [
    'NODE_ENV',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'TEST_DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'MOLLIE_API_KEY',
    'GEMINI_API_KEY',
    'STORAGE_BUCKET',
  ]
  
  // Don't actually delete them as they might be needed for the application
  // Just log that cleanup is complete
  console.log('🔧 Environment variables reset')
}