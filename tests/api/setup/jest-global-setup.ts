/**
 * Jest Global Setup
 * Initialize test environment before all tests run
 */

import { execSync } from 'child_process'
import { Client } from 'pg'

export default async function globalSetup() {
  console.log('🚀 Starting API test environment setup...')
  
  try {
    // Set up test database
    await setupTestDatabase()
    
    // Initialize test data
    await initializeTestData()
    
    // Set up mock services
    await setupMockServices()
    
    console.log('✅ API test environment setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    throw error
  }
}

async function setupTestDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/farewelly_test'
  
  try {
    // Create test database if it doesn't exist
    const adminClient = new Client({
      connectionString: connectionString.replace('/farewelly_test', '/postgres'),
    })
    
    await adminClient.connect()
    
    // Check if test database exists
    const result = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'farewelly_test'"
    )
    
    if (result.rows.length === 0) {
      await adminClient.query('CREATE DATABASE farewelly_test')
      console.log('📦 Created test database: farewelly_test')
    }
    
    await adminClient.end()
    
    // Run migrations on test database
    const testClient = new Client({ connectionString })
    await testClient.connect()
    
    // Create test schema
    await testClient.query('CREATE SCHEMA IF NOT EXISTS test_schema')
    
    // Run basic table creation for testing
    await createTestTables(testClient)
    
    await testClient.end()
    
    console.log('📊 Test database setup complete')
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }
}

async function createTestTables(client: Client) {
  const tables = [
    `
    CREATE TABLE IF NOT EXISTS test_schema.user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('family', 'director', 'venue', 'admin')),
      phone VARCHAR(20),
      company VARCHAR(255),
      address TEXT,
      specializations TEXT[],
      facilities TEXT[],
      capacity INTEGER,
      onboarding_complete BOOLEAN DEFAULT FALSE,
      onboarding_data JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL,
      director_id UUID,
      venue_id UUID,
      service_type VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      price DECIMAL(10,2),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      owner_id UUID NOT NULL,
      owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('family', 'director', 'venue')),
      is_encrypted BOOLEAN DEFAULT FALSE,
      encryption_key TEXT,
      shared_with UUID[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refunded')),
      payment_method VARCHAR(50) NOT NULL,
      provider_payment_id TEXT,
      splits JSONB,
      refunds JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.chat_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(20) NOT NULL CHECK (type IN ('family_director', 'family_venue', 'director_venue', 'group')),
      participants UUID[] NOT NULL,
      booking_id UUID,
      title VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL,
      sender_id UUID NOT NULL,
      sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('family', 'director', 'venue')),
      message TEXT NOT NULL,
      message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'booking', 'system')),
      metadata JSONB,
      read_by UUID[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.calendar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL,
      owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('director', 'venue')),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE NOT NULL,
      booking_id UUID,
      type VARCHAR(20) NOT NULL CHECK (type IN ('booking', 'blocked', 'available')),
      recurring JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.venue_availability (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      venue_id UUID NOT NULL,
      date DATE NOT NULL,
      time_slots JSONB NOT NULL,
      special_pricing JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(venue_id, date)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      director_id UUID NOT NULL,
      family_id UUID NOT NULL,
      relationship_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'archived')),
      notes TEXT,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(director_id, family_id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS test_schema.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('booking', 'payment', 'message', 'system')),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    `,
  ]
  
  for (const table of tables) {
    await client.query(table)
  }
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON test_schema.user_profiles(email)',
    'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON test_schema.user_profiles(user_type)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_family_id ON test_schema.bookings(family_id)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_director_id ON test_schema.bookings(director_id)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON test_schema.bookings(venue_id)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_date ON test_schema.bookings(date)',
    'CREATE INDEX IF NOT EXISTS idx_bookings_status ON test_schema.bookings(status)',
    'CREATE INDEX IF NOT EXISTS idx_documents_owner ON test_schema.documents(owner_id, owner_type)',
    'CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON test_schema.payments(booking_id)',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON test_schema.chat_messages(room_id)',
    'CREATE INDEX IF NOT EXISTS idx_calendar_events_owner ON test_schema.calendar_events(owner_id, owner_type)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON test_schema.notifications(user_id)',
  ]
  
  for (const index of indexes) {
    await client.query(index)
  }
}

async function initializeTestData() {
  // Initialize any required test data
  console.log('📋 Initializing test data...')
  
  // This would seed the database with basic test data
  // For now, we'll keep it minimal and create data in individual tests
}

async function setupMockServices() {
  console.log('🎭 Setting up mock services...')
  
  // Set up environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  
  // Mock external service URLs
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_key'
  process.env.MOLLIE_API_KEY = 'test_mock_mollie_key'
  process.env.GEMINI_API_KEY = 'mock_gemini_api_key'
  
  // Mock file storage
  process.env.STORAGE_BUCKET = 'test-storage-bucket'
  
  console.log('✅ Mock services configured')
}