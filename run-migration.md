# 🚀 Database Migration Required

## ⚠️ Missing Tables Error Fixed

I see the error: `relation "public.funeral_services" does not exist`

## Quick Fix (30 seconds):

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/kbneptalijjgtimulfsi/sql

2. **Copy and paste this SQL** in the SQL Editor:

```sql
-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
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
);

-- Create funeral services table
CREATE TABLE IF NOT EXISTS funeral_services (
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
);

-- Insert sample data
INSERT INTO venues (name, location, venue_type, capacity, price_per_hour, amenities, description, address, active) VALUES
('Westerveld Begraafplaats', 'Amsterdam Noord', 'cemetery', 100, 250.00, ARRAY['parking', 'wheelchair_accessible', 'chapel'], 'Bekende begraafplaats in Amsterdam met prachtige natuur', 'Uitgebreid 8, 1081 NN Amsterdam', true),
('Crematorium Buitenveldert', 'Amsterdam Zuid', 'crematorium', 80, 300.00, ARRAY['parking', 'catering', 'sound_system'], 'Modern crematorium met verschillende ceremonie ruimtes', 'Buitenveldertselaan 1, 1081 AA Amsterdam', true),
('Oude Kerk', 'Amsterdam Centrum', 'church', 200, 400.00, ARRAY['historic', 'organ', 'parking_nearby'], 'Historische kerk in het centrum van Amsterdam', 'Oudekerksplein 23, 1012 GX Amsterdam', true);

INSERT INTO funeral_services (name, type, description, price_range_min, price_range_max, provider, includes, duration_hours, active) VALUES
('Standaard Begrafenis', 'burial', 'Traditionele begrafenis met kist en ceremonie', 4500.00, 7500.00, 'Uitvaartcentrum Nederland', ARRAY['houten_kist', 'ceremonie', 'vervoer', 'grafrechten'], 3, true),
('Eenvoudige Crematie', 'cremation', 'Sobere crematie zonder uitgebreide ceremonie', 2800.00, 4200.00, 'Crematorium Nederland', ARRAY['basic_kist', 'crematie', 'urn'], 2, true),
('Uitgebreide Crematie', 'cremation', 'Crematie met uitgebreide ceremonie en ontvangst', 5200.00, 8500.00, 'Crematorium Nederland', ARRAY['premium_kist', 'ceremonie', 'crematie', 'urn', 'catering'], 4, true);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_services ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public venues are viewable by everyone" ON venues FOR SELECT USING (active = true);
CREATE POLICY "Public funeral services are viewable by everyone" ON funeral_services FOR SELECT USING (active = true);
```

3. **Click "Run"**

4. **Test**: Ask AI "welke locaties zijn beschikbaar?" - should now show real venues! 🎯