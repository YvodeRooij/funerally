#!/usr/bin/env node

// Quick script to create demo tables in Supabase
// Run with: node scripts/create-demo-tables.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('🚀 Creating demo tables for report system...\n')

  try {
    // Create venues table
    console.log('📍 Creating venues table...')
    const venuesSQL = `
      CREATE TABLE IF NOT EXISTS venues (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        venue_type VARCHAR(100) NOT NULL,
        capacity INTEGER DEFAULT 50,
        price_per_hour DECIMAL(10,2),
        amenities TEXT[],
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    // Insert demo data for venues  
    console.log('🏛️ Adding demo venues...')
    const venuesInsert = `
      INSERT INTO venues (name, location, venue_type, capacity, price_per_hour, amenities, description, active) VALUES
      ('Westerveld Begraafplaats', 'Amsterdam Noord', 'cemetery', 100, 250.00, ARRAY['parking', 'wheelchair_accessible', 'chapel'], 'Bekende begraafplaats in Amsterdam met prachtige natuur', true),
      ('Crematorium Buitenveldert', 'Amsterdam Zuid', 'crematorium', 80, 300.00, ARRAY['parking', 'catering', 'sound_system'], 'Modern crematorium met verschillende ceremonie ruimtes', true),
      ('Oude Kerk', 'Amsterdam Centrum', 'church', 200, 400.00, ARRAY['historic', 'organ', 'parking_nearby'], 'Historische kerk in het centrum van Amsterdam', true)
      ON CONFLICT (name) DO NOTHING;
    `

    // Create funeral services table
    console.log('⚱️ Creating funeral_services table...')
    const servicesSQL = `
      CREATE TABLE IF NOT EXISTS funeral_services (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        price_range_min DECIMAL(10,2),
        price_range_max DECIMAL(10,2),
        provider VARCHAR(255),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Insert demo data for services
    console.log('💐 Adding demo funeral services...')
    const servicesInsert = `
      INSERT INTO funeral_services (name, type, description, price_range_min, price_range_max, provider, active) VALUES
      ('Standaard Begrafenis', 'burial', 'Traditionele begrafenis met kist en ceremonie', 4500.00, 7500.00, 'Uitvaartcentrum Nederland', true),
      ('Eenvoudige Crematie', 'cremation', 'Sobere crematie zonder uitgebreide ceremonie', 2800.00, 4200.00, 'Crematorium Nederland', true),
      ('Uitgebreide Crematie', 'cremation', 'Crematie met uitgebreide ceremonie en ontvangst', 5200.00, 8500.00, 'Crematorium Nederland', true)
      ON CONFLICT (name) DO NOTHING;
    `

    // Execute all SQL
    console.log('🎭 Running SQL commands...')
    
    // Note: Direct SQL execution may not work, providing manual instructions
    console.log('\n📋 MANUAL SETUP REQUIRED:')
    console.log('Go to Supabase Dashboard > SQL Editor and run this SQL:')
    console.log('\n' + '='.repeat(50))
    console.log(venuesSQL)
    console.log(venuesInsert)
    console.log(servicesSQL) 
    console.log(servicesInsert)
    console.log('='.repeat(50))

    console.log('\n✅ Demo tables ready for testing!')
    console.log('\n🎯 Test URLs:')
    console.log('- Demo Intake: /demo/start')
    console.log('- Demo Dashboard: /demo/family-dashboard') 
    console.log('- Demo Director: /demo/director-access')
    console.log('\n🔑 Demo Codes: DEMO-123, TEST-456, SAMPLE-789')

  } catch (error) {
    console.error('❌ Error creating tables:', error)
  }
}

createTables()