-- ========================================
-- FAREWELLY DATABASE SCHEMA
-- PostgreSQL Schema for Dutch Funeral Management Platform
-- 
-- Why: Comprehensive schema supporting multi-role marketplace with Dutch regulatory compliance
-- What: Users, bookings, documents, payments, and compliance tracking
-- How: Feature-based organization with strict data integrity and GDPR compliance
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CORE USER MANAGEMENT
-- ========================================

-- Enhanced user profiles with role-based fields
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_provider_id VARCHAR(255) UNIQUE NOT NULL, -- NextAuth user ID
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('family', 'director', 'venue', 'admin')),
    phone VARCHAR(50),
    address TEXT,
    language_preference VARCHAR(5) DEFAULT 'nl' CHECK (language_preference IN ('nl', 'en', 'ar', 'tr', 'de')),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "whatsapp": false}',
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    gdpr_consent_version VARCHAR(10),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    profile_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family-specific profile data
CREATE TABLE family_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    family_code VARCHAR(50) UNIQUE, -- For director connection
    connected_director_id UUID REFERENCES user_profiles(id),
    payment_tier VARCHAR(20) DEFAULT 'standard' CHECK (payment_tier IN ('standard', 'gemeente', 'premium')),
    cultural_preferences JSONB DEFAULT '{}', -- Religious/cultural requirements
    communication_preferences JSONB DEFAULT '{}',
    gemeente_verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (gemeente_verification_status IN ('unverified', 'pending', 'verified', 'declined')),
    gemeente_municipality VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Director-specific profile data
CREATE TABLE director_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    kvk_number VARCHAR(20) UNIQUE,
    kvk_verified BOOLEAN DEFAULT FALSE,
    years_experience INTEGER,
    bio TEXT,
    specializations TEXT[] DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}', -- List of municipalities/regions served
    price_range_min INTEGER,
    price_range_max INTEGER,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform commission percentage
    director_codes_quota INTEGER DEFAULT 5, -- Monthly free codes for families
    director_codes_used INTEGER DEFAULT 0,
    bgnu_member BOOLEAN DEFAULT FALSE, -- Dutch funeral director association
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    compliance_score INTEGER DEFAULT 100 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    availability_calendar JSONB DEFAULT '{}', -- Weekly availability patterns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venue-specific profile data
CREATE TABLE venue_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    venue_name VARCHAR(255) NOT NULL,
    venue_type VARCHAR(100) NOT NULL, -- church, community_hall, crematorium, etc.
    capacity_min INTEGER DEFAULT 10,
    capacity_max INTEGER NOT NULL,
    price_per_hour DECIMAL(8,2),
    minimum_booking_hours INTEGER DEFAULT 2,
    setup_time_hours INTEGER DEFAULT 1,
    cleanup_time_hours INTEGER DEFAULT 1,
    amenities TEXT[] DEFAULT '{}',
    accessibility_features TEXT[] DEFAULT '{}',
    parking_spaces INTEGER,
    catering_allowed BOOLEAN DEFAULT TRUE,
    alcohol_allowed BOOLEAN DEFAULT TRUE,
    external_vendors_allowed BOOLEAN DEFAULT TRUE,
    sound_system_available BOOLEAN DEFAULT FALSE,
    livestream_capable BOOLEAN DEFAULT FALSE,
    location_coordinates POINT, -- PostGIS for mapping
    website VARCHAR(255),
    photos TEXT[] DEFAULT '{}', -- Array of photo URLs
    availability_calendar JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FUNERAL PLANNING & BOOKINGS
-- ========================================

-- Core funeral cases
CREATE TABLE funeral_cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES user_profiles(id),
    assigned_director_id UUID REFERENCES user_profiles(id),
    case_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable case ID
    
    -- Deceased information
    deceased_name VARCHAR(255) NOT NULL,
    deceased_date_of_birth DATE,
    deceased_date_of_death DATE NOT NULL,
    deceased_place_of_death VARCHAR(255),
    deceased_nationality VARCHAR(100),
    deceased_religion VARCHAR(100),
    
    -- Service preferences
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('burial', 'cremation', 'memorial_only', 'direct_cremation')),
    ceremony_type VARCHAR(50) CHECK (ceremony_type IN ('religious', 'secular', 'celebration_of_life', 'simple', 'none')),
    estimated_attendance INTEGER,
    cultural_requirements TEXT[],
    special_requests TEXT,
    
    -- Regulatory compliance
    death_certificate_number VARCHAR(100),
    burial_permit_number VARCHAR(100),
    municipality VARCHAR(100) NOT NULL,
    regulatory_deadline DATE NOT NULL, -- 6 working days from death
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'documents_ready', 'permits_obtained', 'compliant', 'deadline_risk')),
    
    -- Case status and timeline
    case_status VARCHAR(50) DEFAULT 'intake' CHECK (case_status IN ('intake', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    total_estimated_cost DECIMAL(10,2),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'refunded')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_service_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Venue bookings for funeral services
CREATE TABLE venue_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES user_profiles(id),
    booking_type VARCHAR(50) NOT NULL CHECK (booking_type IN ('service', 'reception', 'viewing', 'memorial')),
    
    -- Booking details
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    setup_start TIMESTAMP WITH TIME ZONE,
    cleanup_end TIMESTAMP WITH TIME ZONE,
    expected_attendance INTEGER,
    
    -- Pricing and payments
    hourly_rate DECIMAL(8,2),
    total_hours DECIMAL(4,2),
    base_cost DECIMAL(8,2),
    additional_fees DECIMAL(8,2) DEFAULT 0,
    platform_commission DECIMAL(8,2),
    total_cost DECIMAL(8,2),
    
    -- Booking status
    booking_status VARCHAR(50) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    cancellation_reason TEXT,
    special_requirements TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Service provider bookings (directors)
CREATE TABLE director_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Service details
    service_package VARCHAR(100), -- Basic, Standard, Premium, Custom
    services_included TEXT[],
    estimated_hours DECIMAL(6,2),
    
    -- Pricing
    service_fee DECIMAL(10,2),
    additional_costs DECIMAL(10,2) DEFAULT 0,
    platform_commission DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    
    -- Status and timeline
    booking_status VARCHAR(50) DEFAULT 'quoted' CHECK (booking_status IN ('quoted', 'accepted', 'in_progress', 'completed', 'cancelled')),
    quote_valid_until TIMESTAMP WITH TIME ZONE,
    service_start_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- DOCUMENT MANAGEMENT SYSTEM
-- ========================================

-- Secure document vault with zero-knowledge encryption
CREATE TABLE document_vault (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Document metadata
    document_type VARCHAR(100) NOT NULL, -- death_certificate, burial_permit, insurance_policy, etc.
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Encryption and storage
    encrypted_content BYTEA NOT NULL, -- AES-256 encrypted content
    encryption_key_hash VARCHAR(255) NOT NULL, -- Derived key identifier
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_path TEXT,
    
    -- Access control and sharing
    access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'family', 'director', 'venue', 'public')),
    share_tokens TEXT[] DEFAULT '{}', -- Active sharing tokens
    
    -- GDPR and compliance
    retention_category VARCHAR(50) NOT NULL CHECK (retention_category IN ('immediate', 'financial', 'memorial', 'legal')),
    auto_delete_date DATE,
    gdpr_deletion_requested BOOLEAN DEFAULT FALSE,
    
    -- Document lifecycle
    document_status VARCHAR(50) DEFAULT 'active' CHECK (document_status IN ('active', 'archived', 'deleted', 'expired')),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sharing with time-limited tokens
CREATE TABLE document_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES user_profiles(id), -- NULL for anonymous shares
    share_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Access permissions
    permissions VARCHAR(50)[] DEFAULT '{"view"}' CHECK (permissions <@ ARRAY['view', 'download', 'print']),
    max_access_count INTEGER DEFAULT 1,
    current_access_count INTEGER DEFAULT 0,
    
    -- Time limits
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    access_log JSONB DEFAULT '[]' -- Array of access events
);

-- ========================================
-- PAYMENT PROCESSING
-- ========================================

-- Platform transactions for marketplace model
CREATE TABLE platform_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id),
    family_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('platform_fee', 'service_payment', 'venue_payment', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Payment provider integration (Stripe/Mollie)
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'mollie', 'manual')),
    provider_transaction_id VARCHAR(255),
    provider_payment_intent_id VARCHAR(255),
    
    -- Status tracking
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    
    -- Commission splits
    platform_fee DECIMAL(8,2),
    provider_commission DECIMAL(8,2),
    net_amount DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Commission tracking for providers
CREATE TABLE provider_commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES user_profiles(id),
    transaction_id UUID NOT NULL REFERENCES platform_transactions(id),
    
    -- Commission details
    commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('director_service', 'venue_booking', 'referral_bonus')),
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(8,2) NOT NULL,
    vat_amount DECIMAL(8,2) NOT NULL,
    net_payout DECIMAL(8,2) NOT NULL,
    
    -- Payout status
    payout_status VARCHAR(50) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'ready', 'paid', 'disputed')),
    payout_date DATE,
    payout_reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- COMMUNICATION & WORKFLOWS
-- ========================================

-- LangGraph workflow state persistence
CREATE TABLE workflow_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    workflow_type VARCHAR(100) NOT NULL, -- funeral_planning, document_collection, payment_processing
    
    -- LangGraph state data
    current_node VARCHAR(100) NOT NULL,
    state_data JSONB NOT NULL DEFAULT '{}',
    checkpointed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Human intervention tracking
    pending_interrupts JSONB DEFAULT '[]',
    human_approvals_required TEXT[],
    escalation_level INTEGER DEFAULT 0,
    
    -- Workflow metadata
    workflow_version VARCHAR(20) DEFAULT '1.0',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message center for family-director-venue communication
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Message content
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'document', 'system', 'notification')),
    content TEXT,
    attachments TEXT[] DEFAULT '{}',
    
    -- Recipients and delivery
    recipient_ids UUID[] NOT NULL,
    delivered_to UUID[] DEFAULT '{}',
    read_by UUID[] DEFAULT '{}',
    
    -- Priority and categorization
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50), -- appointment, documents, payment, general
    
    -- Threading
    reply_to_id UUID REFERENCES messages(id),
    thread_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_send_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- COMPLIANCE & AUDIT TRAILS
-- ========================================

-- Regulatory compliance tracking
CREATE TABLE compliance_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funeral_case_id UUID NOT NULL REFERENCES funeral_cases(id) ON DELETE CASCADE,
    
    -- Compliance requirement
    requirement_type VARCHAR(100) NOT NULL, -- death_registration, burial_permit, timeline_compliance
    requirement_description TEXT NOT NULL,
    
    -- Status and timeline
    compliance_status VARCHAR(50) NOT NULL CHECK (compliance_status IN ('pending', 'in_progress', 'completed', 'failed', 'waived')),
    due_date DATE NOT NULL,
    completed_date DATE,
    responsible_party VARCHAR(100), -- municipality, family, director
    
    -- Documentation
    supporting_documents UUID[] DEFAULT '{}', -- References to document_vault
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR-compliant audit trail
CREATE TABLE audit_trail (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- login, document_access, data_update, etc.
    resource_type VARCHAR(50) NOT NULL, -- user, document, booking, etc.
    resource_id UUID NOT NULL,
    
    -- Actor information
    actor_id UUID REFERENCES user_profiles(id),
    actor_type VARCHAR(50) NOT NULL, -- user, system, api
    ip_address INET,
    user_agent TEXT,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    session_id VARCHAR(255),
    api_endpoint VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_auth_provider ON user_profiles(auth_provider_id);

-- Family profile indexes
CREATE INDEX idx_family_profiles_family_code ON family_profiles(family_code);
CREATE INDEX idx_family_profiles_director ON family_profiles(connected_director_id);

-- Director profile indexes
CREATE INDEX idx_director_profiles_kvk ON director_profiles(kvk_number);
CREATE INDEX idx_director_profiles_areas ON director_profiles USING GIN(service_areas);

-- Venue profile indexes
CREATE INDEX idx_venue_profiles_type ON venue_profiles(venue_type);
CREATE INDEX idx_venue_profiles_capacity ON venue_profiles(capacity_max);

-- Funeral case indexes
CREATE INDEX idx_funeral_cases_family ON funeral_cases(family_id);
CREATE INDEX idx_funeral_cases_director ON funeral_cases(assigned_director_id);
CREATE INDEX idx_funeral_cases_status ON funeral_cases(case_status);
CREATE INDEX idx_funeral_cases_deadline ON funeral_cases(regulatory_deadline);
CREATE INDEX idx_funeral_cases_service_date ON funeral_cases(scheduled_service_date);

-- Booking indexes
CREATE INDEX idx_venue_bookings_venue ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_datetime ON venue_bookings(start_datetime, end_datetime);
CREATE INDEX idx_director_bookings_director ON director_bookings(director_id);

-- Document indexes
CREATE INDEX idx_document_vault_case ON document_vault(funeral_case_id);
CREATE INDEX idx_document_vault_type ON document_vault(document_type);
CREATE INDEX idx_document_vault_uploader ON document_vault(uploader_id);

-- Transaction indexes
CREATE INDEX idx_transactions_case ON platform_transactions(funeral_case_id);
CREATE INDEX idx_transactions_family ON platform_transactions(family_id);
CREATE INDEX idx_transactions_status ON platform_transactions(payment_status);

-- Message indexes
CREATE INDEX idx_messages_case ON messages(funeral_case_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipients ON messages USING GIN(recipient_ids);

-- Audit trail indexes
CREATE INDEX idx_audit_resource ON audit_trail(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON audit_trail(actor_id);
CREATE INDEX idx_audit_created ON audit_trail(created_at);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth_provider_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth_provider_id = current_setting('app.current_user_id', true));

-- Funeral case policies
CREATE POLICY "Family can view own cases" ON funeral_cases
    FOR SELECT USING (family_id = (
        SELECT id FROM user_profiles 
        WHERE auth_provider_id = current_setting('app.current_user_id', true)
    ));

CREATE POLICY "Director can view assigned cases" ON funeral_cases
    FOR SELECT USING (assigned_director_id = (
        SELECT id FROM user_profiles 
        WHERE auth_provider_id = current_setting('app.current_user_id', true)
    ));

-- Document vault policies - most restrictive
CREATE POLICY "Document access by case participants" ON document_vault
    FOR SELECT USING (
        funeral_case_id IN (
            SELECT id FROM funeral_cases fc
            WHERE fc.family_id = (
                SELECT id FROM user_profiles 
                WHERE auth_provider_id = current_setting('app.current_user_id', true)
            )
            OR fc.assigned_director_id = (
                SELECT id FROM user_profiles 
                WHERE auth_provider_id = current_setting('app.current_user_id', true)
            )
        )
    );

-- ========================================
-- TRIGGERS FOR AUTOMATION
-- ========================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_profiles_updated_at BEFORE UPDATE ON family_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_director_profiles_updated_at BEFORE UPDATE ON director_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_profiles_updated_at BEFORE UPDATE ON venue_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funeral_cases_updated_at BEFORE UPDATE ON funeral_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatic case number generation
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := 'FW-' || TO_CHAR(NEW.created_at, 'YYYY') || '-' || 
                          LPAD(nextval('case_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE case_number_seq START 1000;

CREATE TRIGGER generate_funeral_case_number BEFORE INSERT ON funeral_cases
    FOR EACH ROW EXECUTE FUNCTION generate_case_number();

-- Audit trail trigger
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_trail (
        action, resource_type, resource_id, actor_id, actor_type,
        old_values, new_values, session_id
    ) VALUES (
        TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
        (SELECT id FROM user_profiles WHERE auth_provider_id = current_setting('app.current_user_id', true)),
        'user',
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        current_setting('app.session_id', true)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_user_profiles AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_funeral_cases AFTER INSERT OR UPDATE OR DELETE ON funeral_cases
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- ========================================
-- INITIAL DATA SETUP
-- ========================================

-- Create admin user type for platform management
INSERT INTO user_profiles (
    auth_provider_id, email, name, user_type, 
    gdpr_consent_date, gdpr_consent_version
) VALUES (
    'system-admin', 'admin@farewelly.nl', 'System Administrator', 'admin',
    NOW(), '1.0'
) ON CONFLICT (auth_provider_id) DO NOTHING;

-- Common document types for the Dutch funeral industry
CREATE TABLE document_types (
    type_code VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    required_for TEXT[] DEFAULT '{}',
    retention_period INTERVAL,
    auto_share_with VARCHAR(50)[] DEFAULT '{}'
);

INSERT INTO document_types VALUES
    ('death_certificate', 'Overlijdensakte (Death Certificate)', '{"all"}', '7 years', '{"director", "municipality"}'),
    ('burial_permit', 'Verlof tot Begraven/Cremeren', '{"burial", "cremation"}', '7 years', '{"director", "venue"}'),
    ('insurance_policy', 'Verzekeringspolis', '{"payment"}', '7 years', '{"director"}'),
    ('id_document', 'Identiteitsbewijs', '{"verification"}', '1 year', '{}'),
    ('medical_certificate', 'Medische Verklaring', '{"regulatory"}', '7 years', '{"municipality"}'),
    ('will_testament', 'Testament', '{"legal"}', 'indefinite', '{}'),
    ('funeral_wishes', 'Uitvaartwensen', '{"planning"}', 'indefinite', '{"director"}'),
    ('memorial_items', 'Herinneringsstukken', '{"memorial"}', 'indefinite', '{}');