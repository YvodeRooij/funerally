-- =============================================================================
-- Farewelly Core Entities Schema
-- This file contains the core database entities for the funeral planning system
-- =============================================================================

-- Extensions needed for the system
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- DECEASED PERSONS TABLE
-- =============================================================================
-- Note: Deceased persons' data is NOT subject to GDPR according to Dutch law
-- Only data of living family members is subject to GDPR protection
CREATE TABLE deceased_persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic deceased information
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    maiden_name VARCHAR(255),
    
    -- Dates and location
    birth_date DATE NOT NULL,
    death_date DATE NOT NULL,
    death_location VARCHAR(255),
    
    -- Dutch specific identifiers
    bsn VARCHAR(9), -- Burgerservicenummer (Dutch SSN)
    birth_place VARCHAR(255),
    nationality VARCHAR(100) DEFAULT 'Dutch',
    
    -- Cultural and religious information
    religion VARCHAR(100),
    cultural_background VARCHAR(100),
    special_requirements TEXT,
    
    -- Service preferences
    preferred_service_type VARCHAR(50) CHECK (preferred_service_type IN ('burial', 'cremation', 'mixed')),
    preferred_ceremony_type VARCHAR(50) CHECK (preferred_ceremony_type IN ('traditional', 'celebration', 'simple', 'direct', 'religious')),
    
    -- Administrative timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Compliance fields
    retention_until DATE, -- Business need based retention
    
    CONSTRAINT valid_death_after_birth CHECK (death_date >= birth_date),
    CONSTRAINT valid_bsn_format CHECK (bsn IS NULL OR LENGTH(bsn) = 9)
);

-- =============================================================================
-- FUNERAL REQUESTS TABLE
-- =============================================================================
-- Central coordination entity for funeral planning
CREATE TABLE funeral_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    deceased_id UUID NOT NULL REFERENCES deceased_persons(id) ON DELETE CASCADE,
    primary_contact_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    assigned_director_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Request details
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('urgent', 'normal', 'flexible')),
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('burial', 'cremation', 'mixed')),
    ceremony_type VARCHAR(50) CHECK (ceremony_type IN ('traditional', 'celebration', 'simple', 'direct', 'religious')),
    
    -- Attendance and logistics
    expected_attendance INTEGER,
    accessibility_requirements TEXT[],
    special_requests TEXT,
    
    -- Timeline (Dutch legal requirements)
    death_registered_at TIMESTAMP WITH TIME ZONE,
    funeral_deadline DATE NOT NULL, -- Must be within 6 working days
    preferred_funeral_date DATE,
    preferred_funeral_time TIME,
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'initiated' CHECK (status IN (
        'initiated', 'gathering_info', 'planning', 'coordinating', 
        'confirmed', 'in_progress', 'completed', 'cancelled'
    )),
    
    -- Financial information
    estimated_budget DECIMAL(10,2),
    financial_assistance_needed BOOLEAN DEFAULT false,
    insurance_coverage BOOLEAN DEFAULT false,
    insurance_provider VARCHAR(255),
    municipal_assistance BOOLEAN DEFAULT false,
    
    -- Cultural and religious requirements
    cultural_requirements JSONB,
    dietary_restrictions TEXT[],
    language_preferences VARCHAR(100)[] DEFAULT ARRAY['Dutch'],
    
    -- Location preferences
    preferred_region VARCHAR(100),
    preferred_municipality VARCHAR(100),
    transport_requirements TEXT,
    
    -- Communication preferences
    preferred_contact_method VARCHAR(50) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'in_person')),
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance (family data is subject to GDPR)
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    data_retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years'), -- Tax requirement
    
    CONSTRAINT valid_funeral_deadline CHECK (funeral_deadline >= death_registered_at::date),
    CONSTRAINT valid_preferred_date CHECK (preferred_funeral_date IS NULL OR preferred_funeral_date <= funeral_deadline)
);

-- =============================================================================
-- VENUES TABLE
-- =============================================================================
-- Locations where funeral services can be held
CREATE TABLE venues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Venue owner/manager
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Basic venue information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    venue_type VARCHAR(100) NOT NULL CHECK (venue_type IN (
        'funeral_home', 'church', 'crematorium', 'cemetery', 'community_center', 
        'hotel', 'restaurant', 'outdoor', 'cultural_center', 'other'
    )),
    
    -- Location details
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'Netherlands',
    
    -- Geographic coordinates for mapping
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Capacity and technical specifications
    max_capacity INTEGER NOT NULL,
    min_capacity INTEGER DEFAULT 1,
    wheelchair_accessible BOOLEAN DEFAULT false,
    parking_spots INTEGER DEFAULT 0,
    
    -- Amenities and features
    amenities TEXT[] DEFAULT '{}',
    audio_visual_equipment BOOLEAN DEFAULT false,
    catering_kitchen BOOLEAN DEFAULT false,
    outdoor_space BOOLEAN DEFAULT false,
    prayer_facilities BOOLEAN DEFAULT false,
    
    -- Pricing
    base_price_per_hour DECIMAL(8,2) NOT NULL,
    minimum_booking_hours INTEGER DEFAULT 2,
    weekend_surcharge_percent INTEGER DEFAULT 0,
    cleaning_fee DECIMAL(8,2) DEFAULT 0,
    
    -- Availability
    operates_weekends BOOLEAN DEFAULT true,
    operates_evenings BOOLEAN DEFAULT true,
    advance_booking_days INTEGER DEFAULT 7,
    
    -- Business information
    business_license VARCHAR(100),
    insurance_coverage BOOLEAN DEFAULT false,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Status and verification
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_documents TEXT[],
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_capacity CHECK (max_capacity >= min_capacity),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

-- =============================================================================
-- BOOKINGS TABLE
-- =============================================================================
-- Venue reservations for funeral services
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    booked_by_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Booking details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(3,1) NOT NULL,
    
    -- Pricing
    base_cost DECIMAL(10,2) NOT NULL,
    additional_fees DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded'
    )),
    
    -- Additional services
    catering_required BOOLEAN DEFAULT false,
    catering_guest_count INTEGER,
    catering_cost DECIMAL(10,2) DEFAULT 0,
    
    av_equipment_required BOOLEAN DEFAULT false,
    av_setup_cost DECIMAL(10,2) DEFAULT 0,
    
    decorations_allowed BOOLEAN DEFAULT true,
    setup_time_hours DECIMAL(2,1) DEFAULT 1,
    cleanup_time_hours DECIMAL(2,1) DEFAULT 1,
    
    -- Special requirements
    special_requirements TEXT,
    access_instructions TEXT,
    
    -- Confirmation and payment
    confirmed_at TIMESTAMP WITH TIME ZONE,
    payment_due_date DATE,
    payment_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Cancellation policy
    cancellation_policy TEXT,
    cancellation_deadline DATE,
    cancellation_fee_percent INTEGER DEFAULT 0,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_booking_time CHECK (end_time > start_time),
    CONSTRAINT valid_duration CHECK (duration_hours > 0),
    CONSTRAINT valid_total_cost CHECK (total_cost = base_cost + additional_fees + catering_cost + av_setup_cost)
);

-- =============================================================================
-- SERVICE PROVIDERS TABLE
-- =============================================================================
-- Extended information for funeral directors and service providers
CREATE TABLE service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Links to user profile
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Business information
    business_name VARCHAR(255) NOT NULL,
    kvk_number VARCHAR(20) UNIQUE, -- Dutch Chamber of Commerce number
    btw_number VARCHAR(20), -- Dutch VAT number
    
    -- Certifications and memberships
    bgnu_member BOOLEAN DEFAULT false, -- Branchevereniging van Grafdelvers en Natura Uitvaart
    certifications TEXT[],
    insurance_coverage BOOLEAN DEFAULT false,
    insurance_provider VARCHAR(255),
    
    -- Service offerings
    services_offered TEXT[] DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',
    languages_spoken VARCHAR(100)[] DEFAULT ARRAY['Dutch'],
    
    -- Coverage area
    service_regions TEXT[] DEFAULT '{}',
    travel_distance_km INTEGER DEFAULT 50,
    travel_fee_per_km DECIMAL(4,2) DEFAULT 0,
    
    -- Pricing structure
    price_structure JSONB, -- Flexible pricing based on service type
    payment_terms TEXT,
    accepts_insurance BOOLEAN DEFAULT true,
    offers_payment_plans BOOLEAN DEFAULT true,
    
    -- Capacity and availability
    max_concurrent_services INTEGER DEFAULT 5,
    advance_booking_days INTEGER DEFAULT 14,
    emergency_services BOOLEAN DEFAULT true,
    
    -- Ratings and reviews
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_services_completed INTEGER DEFAULT 0,
    
    -- Administrative
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES user_profiles(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_provider UNIQUE (user_profile_id)
);

-- =============================================================================
-- COMMUNICATIONS TABLE
-- =============================================================================
-- Track all communications between parties
CREATE TABLE communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Communication details
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN (
        'email', 'sms', 'whatsapp', 'phone_call', 'in_person', 'system_notification'
    )),
    
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
    
    -- Metadata
    external_message_id VARCHAR(255), -- For tracking with external services
    read_at TIMESTAMP WITH TIME ZONE,
    response_required BOOLEAN DEFAULT false,
    response_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Privacy and compliance
    contains_sensitive_data BOOLEAN DEFAULT false,
    retention_period INTERVAL DEFAULT INTERVAL '7 years',
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
-- Track payment processing and financial assistance
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN (
        'full_payment', 'deposit', 'installment', 'refund', 'insurance_claim', 'municipal_assistance'
    )),
    
    -- Payment method
    payment_method VARCHAR(50) CHECK (payment_method IN (
        'credit_card', 'debit_card', 'bank_transfer', 'ideal', 'paypal', 'cash', 'check', 'insurance_direct'
    )),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- Payment processor information
    processor VARCHAR(50), -- Stripe, Mollie, etc.
    processor_payment_id VARCHAR(255),
    processor_fee DECIMAL(8,2) DEFAULT 0,
    
    -- Assistance tracking
    assistance_type VARCHAR(50) CHECK (assistance_type IN (
        'none', 'bijzondere_bijstand', 'insurance', 'crowdfunding', 'family_support', 'installment_plan'
    )),
    assistance_amount DECIMAL(10,2) DEFAULT 0,
    assistance_reference VARCHAR(255),
    
    -- Due dates and scheduling
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_assistance_amount CHECK (assistance_amount >= 0)
);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_deceased_persons_updated_at 
    BEFORE UPDATE ON deceased_persons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funeral_requests_updated_at 
    BEFORE UPDATE ON funeral_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at 
    BEFORE UPDATE ON venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at 
    BEFORE UPDATE ON service_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_updated_at 
    BEFORE UPDATE ON communications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();