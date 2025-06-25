-- Migration: Create tables for funeral venues and services data
-- This enables the AI agent to provide real location and pricing information

-- Table for funeral venues/locations
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  venue_type VARCHAR(100) NOT NULL, -- 'cemetery', 'crematorium', 'church', 'funeral_home'
  capacity INTEGER DEFAULT 50,
  price_per_hour DECIMAL(10,2),
  amenities TEXT[], -- Array of amenities like 'parking', 'wheelchair_accessible', 'catering'
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for funeral services and options
CREATE TABLE IF NOT EXISTS funeral_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'burial', 'cremation', 'memorial', 'celebration_of_life'
  description TEXT,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  provider VARCHAR(255), -- Company/organization providing the service
  includes TEXT[], -- What's included in the service
  duration_hours INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample venue data for the AI to use
INSERT INTO venues (name, location, venue_type, capacity, price_per_hour, amenities, description, address, active) VALUES
('Westerveld Begraafplaats', 'Amsterdam Noord', 'cemetery', 100, 250.00, ARRAY['parking', 'wheelchair_accessible', 'chapel'], 'Bekende begraafplaats in Amsterdam met prachtige natuur', 'Uitgebreid 8, 1081 NN Amsterdam', true),
('Crematorium Buitenveldert', 'Amsterdam Zuid', 'crematorium', 80, 300.00, ARRAY['parking', 'catering', 'sound_system'], 'Modern crematorium met verschillende ceremonie ruimtes', 'Buitenveldertselaan 1, 1081 AA Amsterdam', true),
('Oude Kerk', 'Amsterdam Centrum', 'church', 200, 400.00, ARRAY['historic', 'organ', 'parking_nearby'], 'Historische kerk in het centrum van Amsterdam', 'Oudekerksplein 23, 1012 GX Amsterdam', true),
('Uitvaartzaal De Roos', 'Haarlem', 'funeral_home', 60, 200.00, ARRAY['parking', 'catering', 'wheelchair_accessible'], 'Sfeervolle uitvaartzaal met persoonlijke begeleiding', 'Grote Markt 12, 2011 RD Haarlem', true),
('Begraafplaats Sint Barbara', 'Utrecht', 'cemetery', 120, 275.00, ARRAY['parking', 'chapel', 'garden_of_remembrance'], 'Rustige begraafplaats met verschillende grafopties', 'Groeneweg 238, 3515 LN Utrecht', true);

-- Insert sample funeral service data
INSERT INTO funeral_services (name, type, description, price_range_min, price_range_max, provider, includes, duration_hours, active) VALUES
('Standaard Begrafenis', 'burial', 'Traditionele begrafenis met kist en ceremonie', 4500.00, 7500.00, 'Uitvaartcentrum Nederland', ARRAY['houten_kist', 'ceremonie', 'vervoer', 'grafrechten'], 3, true),
('Eenvoudige Crematie', 'cremation', 'Sobere crematie zonder uitgebreide ceremonie', 2800.00, 4200.00, 'Crematorium Nederland', ARRAY['basic_kist', 'crematie', 'urn'], 2, true),
('Uitgebreide Crematie', 'cremation', 'Crematie met uitgebreide ceremonie en ontvangst', 5200.00, 8500.00, 'Crematorium Nederland', ARRAY['premium_kist', 'ceremonie', 'crematie', 'urn', 'catering'], 4, true),
('Eco Begrafenis', 'burial', 'Milieuvriendelijke begrafenis met biologisch afbreekbare kist', 3800.00, 6200.00, 'Groene Uitvaart', ARRAY['eco_kist', 'ceremonie', 'boom_plant', 'natuurgraf'], 3, true),
('Herdenking Bijeenkomst', 'memorial', 'Herdenkingsbijeenkomst zonder lichaam aanwezig', 1500.00, 3500.00, 'Memorial Services', ARRAY['locatie', 'ceremonie', 'catering', 'herinneringen'], 3, true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(location);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(active);
CREATE INDEX IF NOT EXISTS idx_funeral_services_type ON funeral_services(type);
CREATE INDEX IF NOT EXISTS idx_funeral_services_active ON funeral_services(active);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_services ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (venues and services are public info)
CREATE POLICY "Public venues are viewable by everyone" ON venues
  FOR SELECT USING (active = true);

CREATE POLICY "Public funeral services are viewable by everyone" ON funeral_services  
  FOR SELECT USING (active = true);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funeral_services_updated_at BEFORE UPDATE ON funeral_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE venues IS 'Funeral venues, cemeteries, crematoriums, and ceremony locations with pricing and capacity info for AI assistant';
COMMENT ON TABLE funeral_services IS 'Funeral service types and packages with pricing ranges for AI assistant recommendations';