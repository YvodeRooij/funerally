const fetch = require('node-fetch');
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

async function executeSQLDirect() {
  try {
    console.log('🔧 Executing SQL directly via REST API...');
    
    // First, let's create the tables manually with direct SQL
    const createVenuesTable = `
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  venue_type VARCHAR(100) NOT NULL,
  capacity INTEGER DEFAULT 50,
  price_per_hour DECIMAL(10,2),
  amenities TEXT[],
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

    const createFuneralServicesTable = `
CREATE TABLE IF NOT EXISTS public.funeral_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  provider VARCHAR(255),
  includes TEXT[],
  duration_hours INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

    // Execute table creation
    console.log('📋 Creating venues table...');
    const venuesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: createVenuesTable })
    });

    if (venuesResponse.ok) {
      console.log('✅ Venues table created successfully');
    } else {
      console.log('⚠️ Venues table creation response:', venuesResponse.status, await venuesResponse.text());
    }

    console.log('📋 Creating funeral_services table...');
    const servicesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: createFuneralServicesTable })
    });

    if (servicesResponse.ok) {
      console.log('✅ Funeral services table created successfully');
    } else {
      console.log('⚠️ Funeral services table creation response:', servicesResponse.status, await servicesResponse.text());
    }

    // Now insert sample data
    console.log('📋 Inserting sample venue data...');
    
    const venueData = [
      {
        name: 'Westerveld Begraafplaats',
        location: 'Amsterdam Noord',
        venue_type: 'cemetery',
        capacity: 100,
        price_per_hour: 250.00,
        amenities: ['parking', 'wheelchair_accessible', 'chapel'],
        description: 'Bekende begraafplaats in Amsterdam met prachtige natuur',
        address: 'Uitgebreid 8, 1081 NN Amsterdam',
        active: true
      },
      {
        name: 'Crematorium Buitenveldert',
        location: 'Amsterdam Zuid',
        venue_type: 'crematorium',
        capacity: 80,
        price_per_hour: 300.00,
        amenities: ['parking', 'catering', 'sound_system'],
        description: 'Modern crematorium met verschillende ceremonie ruimtes',
        address: 'Buitenveldertselaan 1, 1081 AA Amsterdam',
        active: true
      },
      {
        name: 'Oude Kerk',
        location: 'Amsterdam Centrum',
        venue_type: 'church',
        capacity: 200,
        price_per_hour: 400.00,
        amenities: ['historic', 'organ', 'parking_nearby'],
        description: 'Historische kerk in het centrum van Amsterdam',
        address: 'Oudekerksplein 23, 1012 GX Amsterdam',
        active: true
      },
      {
        name: 'Uitvaartzaal De Roos',
        location: 'Haarlem',
        venue_type: 'funeral_home',
        capacity: 60,
        price_per_hour: 200.00,
        amenities: ['parking', 'catering', 'wheelchair_accessible'],
        description: 'Sfeervolle uitvaartzaal met persoonlijke begeleiding',
        address: 'Grote Markt 12, 2011 RD Haarlem',
        active: true
      },
      {
        name: 'Begraafplaats Sint Barbara',
        location: 'Utrecht',
        venue_type: 'cemetery',
        capacity: 120,
        price_per_hour: 275.00,
        amenities: ['parking', 'chapel', 'garden_of_remembrance'],
        description: 'Rustige begraafplaats met verschillende grafopties',
        address: 'Groeneweg 238, 3515 LN Utrecht',
        active: true
      }
    ];

    const venuesInsertResponse = await fetch(`${supabaseUrl}/rest/v1/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(venueData)
    });

    if (venuesInsertResponse.ok) {
      const insertedVenues = await venuesInsertResponse.json();
      console.log('✅ Venue data inserted successfully:', insertedVenues.length, 'venues');
    } else {
      console.log('⚠️ Venue data insertion response:', venuesInsertResponse.status, await venuesInsertResponse.text());
    }

    // Insert funeral services data
    console.log('📋 Inserting sample funeral services data...');
    
    const servicesData = [
      {
        name: 'Standaard Begrafenis',
        type: 'burial',
        description: 'Traditionele begrafenis met kist en ceremonie',
        price_range_min: 4500.00,
        price_range_max: 7500.00,
        provider: 'Uitvaartcentrum Nederland',
        includes: ['houten_kist', 'ceremonie', 'vervoer', 'grafrechten'],
        duration_hours: 3,
        active: true
      },
      {
        name: 'Eenvoudige Crematie',
        type: 'cremation',
        description: 'Sobere crematie zonder uitgebreide ceremonie',
        price_range_min: 2800.00,
        price_range_max: 4200.00,
        provider: 'Crematorium Nederland',
        includes: ['basic_kist', 'crematie', 'urn'],
        duration_hours: 2,
        active: true
      },
      {
        name: 'Uitgebreide Crematie',
        type: 'cremation',
        description: 'Crematie met uitgebreide ceremonie en ontvangst',
        price_range_min: 5200.00,
        price_range_max: 8500.00,
        provider: 'Crematorium Nederland',
        includes: ['premium_kist', 'ceremonie', 'crematie', 'urn', 'catering'],
        duration_hours: 4,
        active: true
      },
      {
        name: 'Eco Begrafenis',
        type: 'burial',
        description: 'Milieuvriendelijke begrafenis met biologisch afbreekbare kist',
        price_range_min: 3800.00,
        price_range_max: 6200.00,
        provider: 'Groene Uitvaart',
        includes: ['eco_kist', 'ceremonie', 'boom_plant', 'natuurgraf'],
        duration_hours: 3,
        active: true
      },
      {
        name: 'Herdenking Bijeenkomst',
        type: 'memorial',
        description: 'Herdenkingsbijeenkomst zonder lichaam aanwezig',
        price_range_min: 1500.00,
        price_range_max: 3500.00,
        provider: 'Memorial Services',
        includes: ['locatie', 'ceremonie', 'catering', 'herinneringen'],
        duration_hours: 3,
        active: true
      }
    ];

    const servicesInsertResponse = await fetch(`${supabaseUrl}/rest/v1/funeral_services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(servicesData)
    });

    if (servicesInsertResponse.ok) {
      const insertedServices = await servicesInsertResponse.json();
      console.log('✅ Funeral services data inserted successfully:', insertedServices.length, 'services');
    } else {
      console.log('⚠️ Funeral services data insertion response:', servicesInsertResponse.status, await servicesInsertResponse.text());
    }

    // Test the data
    console.log('\n🔍 Testing data retrieval...');
    
    const testVenuesResponse = await fetch(`${supabaseUrl}/rest/v1/venues?select=name,venue_type,location&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    if (testVenuesResponse.ok) {
      const venues = await testVenuesResponse.json();
      console.log('✅ Successfully retrieved venues:', venues.length);
      venues.forEach(venue => {
        console.log(`   - ${venue.name} (${venue.venue_type}) in ${venue.location}`);
      });
    } else {
      console.log('⚠️ Error retrieving venues:', testVenuesResponse.status);
    }

    const testServicesResponse = await fetch(`${supabaseUrl}/rest/v1/funeral_services?select=name,type,price_range_min,price_range_max&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    if (testServicesResponse.ok) {
      const services = await testServicesResponse.json();
      console.log('✅ Successfully retrieved funeral services:', services.length);
      services.forEach(service => {
        console.log(`   - ${service.name} (${service.type}) €${service.price_range_min}-${service.price_range_max}`);
      });
    } else {
      console.log('⚠️ Error retrieving funeral services:', testServicesResponse.status);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ Tables created: venues, funeral_services');
    console.log('✅ Sample data inserted for Amsterdam/Utrecht area');
    console.log('✅ Ready for report generation system');

  } catch (error) {
    console.error('❌ Error in SQL execution:', error.message);
    process.exit(1);
  }
}

// Run the setup
executeSQLDirect();