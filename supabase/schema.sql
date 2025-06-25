-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  user_type TEXT CHECK (user_type IN ('family', 'director', 'venue', 'admin')),
  phone TEXT,
  address TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create director-specific profile data
CREATE TABLE IF NOT EXISTS public.director_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  kvk_number TEXT,
  years_experience INTEGER,
  bio TEXT,
  price_range_min DECIMAL(10, 2),
  price_range_max DECIMAL(10, 2),
  availability JSONB DEFAULT '{}'::jsonb,
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  PRIMARY KEY (id)
);

-- Create venue-specific profile data
CREATE TABLE IF NOT EXISTS public.venue_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_name TEXT,
  venue_type TEXT,
  capacity INTEGER,
  price_per_hour DECIMAL(10, 2),
  minimum_hours INTEGER,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  website TEXT,
  PRIMARY KEY (id)
);

-- Create family-specific profile data
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emergency_contact TEXT,
  family_code TEXT UNIQUE,
  connected_director UUID REFERENCES public.profiles(id),
  preferences JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

-- Create roles and permissions tables
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user-role relationships
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Insert default roles
INSERT INTO public.roles (name, permissions) VALUES
  ('admin', ARRAY['*']),
  ('director', ARRAY['manage_services', 'view_clients', 'manage_bookings', 'view_analytics']),
  ('venue', ARRAY['manage_venue', 'view_bookings', 'manage_availability', 'view_analytics']),
  ('family', ARRAY['view_services', 'create_booking', 'manage_profile', 'view_memorials'])
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (user_type IN ('director', 'venue'));

-- Create policies for director profiles
CREATE POLICY "Directors can manage their own profile" ON public.director_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can view director profiles" ON public.director_profiles
  FOR SELECT USING (true);

-- Create policies for venue profiles
CREATE POLICY "Venues can manage their own profile" ON public.venue_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can view venue profiles" ON public.venue_profiles
  FOR SELECT USING (true);

-- Create policies for family profiles
CREATE POLICY "Families can manage their own profile" ON public.family_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Directors can view connected family profiles" ON public.family_profiles
  FOR SELECT USING (
    connected_director = auth.uid() OR
    auth.uid() = id
  );

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_director_profiles_kvk ON public.director_profiles(kvk_number);
CREATE INDEX IF NOT EXISTS idx_family_profiles_code ON public.family_profiles(family_code);
CREATE INDEX IF NOT EXISTS idx_family_profiles_director ON public.family_profiles(connected_director);