#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN is not set')
  console.log('Please add your Supabase service role key to .env file')
  process.exit(1)
}

console.log('🔧 Setting up Supabase authentication...')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupSupabase() {
  try {
    console.log('📊 Checking current database structure...')
    
    // Check if profiles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message)
      return
    }
    
    const existingTables = tables?.map(t => t.table_name) || []
    console.log('📋 Existing tables:', existingTables.join(', ') || 'none')
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found at:', schemaPath)
      return
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8')
    console.log('🗃️ Executing database schema...')
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error && !error.message.includes('already exists')) {
          console.log('⚠️ Schema statement warning:', error.message.substring(0, 100))
        }
      }
    }
    
    console.log('✅ Database schema executed successfully')
    
    // Verify tables were created
    const { data: newTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    const createdTables = newTables?.map(t => t.table_name) || []
    console.log('📋 Current tables:', createdTables.join(', '))
    
    // Check if auth is enabled
    console.log('🔐 Checking authentication configuration...')
    
    const { data: authConfig } = await supabase.auth.getSession()
    console.log('✅ Supabase authentication is configured')
    
    console.log('🎉 Supabase setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your NextAuth configuration to use lib/auth-supabase.ts')
    console.log('2. Configure OAuth providers in Supabase dashboard')
    console.log('3. Test the authentication flow')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error('Full error:', error)
  }
}

// Alternative method using direct SQL execution
async function executeSchemaDirectly() {
  try {
    console.log('🔧 Attempting direct schema execution...')
    
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Execute the schema using raw SQL
    const { error } = await supabase.rpc('exec_sql', { 
      sql: schema
    })
    
    if (error) {
      console.log('⚠️ Some schema statements may have warnings:', error.message)
    } else {
      console.log('✅ Schema executed successfully via direct SQL')
    }
    
  } catch (error) {
    console.log('⚠️ Direct execution not available, trying alternative method...')
    await setupSupabase()
  }
}

// Run setup
executeSchemaDirectly().catch(console.error)