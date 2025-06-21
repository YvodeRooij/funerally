-- Create user_profiles table in Supabase
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('family', 'director', 'venue')),
  phone VARCHAR(50),
  address TEXT,
  company VARCHAR(255),
  
  -- Director specific fields
  kvk_number VARCHAR(20),
  years_experience INTEGER,
  bio TEXT,
  price_range_min INTEGER,
  price_range_max INTEGER,
  availability JSONB,
  specializations TEXT[],
  
  -- Venue specific fields
  venue_name VARCHAR(255),
  venue_type VARCHAR(100),
  capacity INTEGER,
  price_per_hour INTEGER,
  minimum_hours INTEGER,
  amenities TEXT[],
  website VARCHAR(255),
  
  -- Family specific fields
  emergency_contact VARCHAR(255),
  family_code VARCHAR(50),
  connected_director VARCHAR(255),
  preferences JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_code ON user_profiles(family_code);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);
