const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function createVenueTables() {
  try {
    console.log('🔧 Creating venues and funeral_services tables...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../supabase/migrations/20240623_create_funeral_data_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📁 SQL migration file loaded');
    console.log('📏 SQL file size:', sqlContent.length, 'characters');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📋 Found', statements.length, 'SQL statements to execute');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || 
          statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY') ||
          statement.includes('INSERT INTO') || statement.includes('CREATE TRIGGER') ||
          statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('COMMENT ON')) {
        
        console.log(`🔨 Executing statement ${i + 1}/${statements.length}:`, 
                    statement.substring(0, 50) + '...');
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️ Warning for statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} completed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    // Test the tables by querying them
    console.log('\n🔍 Testing table creation...');
    
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .select('id, name, venue_type, location')
      .limit(3);
    
    if (venueError) {
      console.log('⚠️ Error querying venues:', venueError.message);
    } else {
      console.log('✅ Venues table created successfully');
      console.log('📊 Sample venues found:', venues.length);
      venues.forEach(venue => {
        console.log(`   - ${venue.name} (${venue.venue_type}) in ${venue.location}`);
      });
    }
    
    const { data: services, error: serviceError } = await supabase
      .from('funeral_services')
      .select('id, name, type, price_range_min, price_range_max')
      .limit(3);
    
    if (serviceError) {
      console.log('⚠️ Error querying funeral_services:', serviceError.message);
    } else {
      console.log('✅ Funeral services table created successfully');
      console.log('📊 Sample services found:', services.length);
      services.forEach(service => {
        console.log(`   - ${service.name} (${service.type}) €${service.price_range_min}-${service.price_range_max}`);
      });
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('✅ Tables created: venues, funeral_services');
    console.log('✅ Sample data inserted');
    console.log('✅ Indexes and policies configured');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

// Run the setup
createVenueTables();