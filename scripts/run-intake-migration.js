#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running intake tables migration...\n')

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240623_create_intake_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split into individual statements (simple split, may need refinement for complex SQL)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement 
      }).single()

      if (error) {
        // Try direct execution as alternative
        console.log('⚠️  RPC failed, trying alternative method...')
        
        // Note: This is a simplified approach. In production, you'd use
        // proper migration tools or Supabase CLI
        console.log('❌ Direct SQL execution not available via client library')
        console.log('Please run the migration using Supabase CLI or dashboard')
        
        console.log('\n📋 Migration file location:')
        console.log(migrationPath)
        
        console.log('\n🔧 To run manually:')
        console.log('1. Go to Supabase Dashboard > SQL Editor')
        console.log('2. Copy and paste the migration file content')
        console.log('3. Click "Run"')
        
        process.exit(1)
      }
    }

    console.log('\n✅ Migration completed successfully!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    
    const tables = ['family_intakes', 'intake_chat_history', 'intake_reports', 'report_access']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error && error.code !== '42P01') { // 42P01 = table does not exist
        console.log(`❌ Error checking table ${table}:`, error.message)
      } else if (error) {
        console.log(`❌ Table ${table} does not exist`)
      } else {
        console.log(`✅ Table ${table} exists`)
      }
    }

    console.log('\n🎉 Intake system database setup complete!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Provide migration instructions
async function provideMigrationInstructions() {
  console.log('\n📋 Manual Migration Instructions:')
  console.log('=====================================\n')
  
  console.log('Option 1: Supabase Dashboard')
  console.log('1. Go to: https://supabase.com/dashboard/project/kbneptalijjgtimulfsi/sql')
  console.log('2. Click "New query"')
  console.log('3. Copy the content from: supabase/migrations/20240623_create_intake_tables.sql')
  console.log('4. Paste and click "Run"\n')
  
  console.log('Option 2: Supabase CLI')
  console.log('1. Install Supabase CLI: npm install -g supabase')
  console.log('2. Login: supabase login')
  console.log('3. Link project: supabase link --project-ref kbneptalijjgtimulfsi')
  console.log('4. Run migration: supabase db push\n')
  
  console.log('Option 3: Direct Connection (if available)')
  console.log('1. Use the DATABASE_URL from your .env file')
  console.log('2. Connect with psql or another PostgreSQL client')
  console.log('3. Run the migration SQL file\n')
}

// Main execution
console.log('🏥 farewelly Intake System - Database Setup')
console.log('==========================================\n')

console.log('⚠️  Note: Direct SQL execution via Supabase client is limited.')
console.log('For best results, use the Supabase Dashboard or CLI.\n')

provideMigrationInstructions()

console.log('\n💡 After running the migration, test the intake system at:')
console.log('   http://localhost:3000/auth → Sign up as Familie → Complete flow')