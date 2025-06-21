-- =============================================================================
-- Farewelly Audit Logging Schema for Compliance
-- This file contains comprehensive audit logging for GDPR and regulatory compliance
-- =============================================================================

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================
-- Comprehensive audit trail for all system actions
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event identification
    event_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL CHECK (event_category IN (
        'authentication', 'authorization', 'data_access', 'data_modification', 
        'document_access', 'payment', 'communication', 'system_admin', 'compliance'
    )),
    
    -- Actor information
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255), -- Stored for reference even if user is deleted
    user_type VARCHAR(20), -- family, director, venue, admin
    session_id VARCHAR(255),
    
    -- Target information (what was acted upon)
    target_type VARCHAR(50), -- table name or entity type
    target_id UUID, -- primary key of the affected record
    target_description TEXT, -- human-readable description
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    old_values JSONB, -- Previous values (for UPDATE operations)
    new_values JSONB, -- New values (for CREATE/UPDATE operations)
    
    -- Request context
    http_method VARCHAR(10),
    endpoint VARCHAR(255),
    request_id VARCHAR(255),
    
    -- Technical context
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Geolocation
    country_code VARCHAR(2),
    city VARCHAR(100),
    
    -- Compliance context
    gdpr_lawful_basis VARCHAR(50), -- consent, contract, legal_obligation, vital_interests, public_task, legitimate_interests
    data_subject_type VARCHAR(20) CHECK (data_subject_type IN ('living_person', 'deceased_person', 'business_entity')),
    processing_purpose TEXT,
    
    -- Risk assessment
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    anomaly_score DECIMAL(3,2), -- 0.00 to 1.00, for ML-based anomaly detection
    
    -- Result and impact
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Retention
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '10 years'), -- Regulatory requirement
    
    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- GDPR COMPLIANCE LOG TABLE
-- =============================================================================
-- Specific tracking for GDPR compliance activities
CREATE TABLE gdpr_compliance_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Data subject information
    data_subject_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    data_subject_email VARCHAR(255) NOT NULL,
    data_subject_type VARCHAR(20) NOT NULL CHECK (data_subject_type IN ('family_member', 'business_contact')),
    
    -- GDPR activity type
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'consent_given', 'consent_withdrawn', 'data_access_request', 'data_portability_request',
        'data_rectification_request', 'data_erasure_request', 'processing_restriction_request',
        'objection_to_processing', 'automated_decision_objection', 'breach_notification'
    )),
    
    -- Request details
    request_description TEXT NOT NULL,
    request_source VARCHAR(50) CHECK (request_source IN ('email', 'phone', 'in_person', 'web_form', 'mail')),
    
    -- Processing details
    lawful_basis VARCHAR(50) NOT NULL CHECK (lawful_basis IN (
        'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    )),
    
    -- Response tracking
    response_deadline DATE NOT NULL, -- 30 days for most requests, 3 days for breach notifications
    response_status VARCHAR(20) DEFAULT 'received' CHECK (response_status IN (
        'received', 'processing', 'completed', 'partially_completed', 'rejected', 'extended'
    )),
    response_provided_at TIMESTAMP WITH TIME ZONE,
    
    -- Data affected
    data_categories TEXT[], -- e.g., 'personal_details', 'financial_data', 'communications'
    processing_systems TEXT[], -- Which systems/tables were affected
    
    -- Actions taken
    actions_taken TEXT NOT NULL,
    data_deleted BOOLEAN DEFAULT false,
    data_anonymized BOOLEAN DEFAULT false,
    data_exported BOOLEAN DEFAULT false,
    
    -- Legal basis for rejection (if applicable)
    rejection_reason TEXT,
    legal_justification TEXT,
    
    -- Associated staff
    handled_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approved_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- External notifications (for breaches)
    authority_notified BOOLEAN DEFAULT false,
    authority_notification_date TIMESTAMP WITH TIME ZONE,
    data_subjects_notified BOOLEAN DEFAULT false,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Compliance retention (permanent for legal defense)
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '25 years')
);

-- =============================================================================
-- DATA BREACH LOG TABLE
-- =============================================================================
-- Security incident and data breach tracking
CREATE TABLE data_breach_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Breach identification
    breach_reference VARCHAR(100) UNIQUE NOT NULL,
    breach_type VARCHAR(50) NOT NULL CHECK (breach_type IN (
        'unauthorized_access', 'data_loss', 'system_compromise', 'insider_threat',
        'ransomware', 'phishing', 'social_engineering', 'physical_theft', 'accidental_disclosure'
    )),
    
    -- Discovery details
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    discovered_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    discovery_method VARCHAR(50) CHECK (discovery_method IN (
        'automated_monitoring', 'user_report', 'security_audit', 'external_notification', 'incident_response'
    )),
    
    -- Breach details
    description TEXT NOT NULL,
    root_cause TEXT,
    attack_vector VARCHAR(100),
    
    -- Impact assessment
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    data_subjects_affected INTEGER DEFAULT 0,
    data_categories_affected TEXT[] NOT NULL,
    
    -- Technical details
    systems_affected TEXT[] NOT NULL,
    vulnerability_exploited TEXT,
    
    -- Timeline
    estimated_start_time TIMESTAMP WITH TIME ZONE,
    containment_time TIMESTAMP WITH TIME ZONE,
    resolution_time TIMESTAMP WITH TIME ZONE,
    
    -- Response actions
    immediate_actions_taken TEXT NOT NULL,
    containment_measures TEXT,
    remediation_steps TEXT,
    
    -- Notifications and reporting
    internal_notification_sent BOOLEAN DEFAULT false,
    management_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Regulatory reporting (72-hour rule for GDPR)
    requires_authority_notification BOOLEAN DEFAULT false,
    authority_notification_deadline TIMESTAMP WITH TIME ZONE,
    authority_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Data subject notification
    requires_data_subject_notification BOOLEAN DEFAULT false,
    data_subjects_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Investigation
    investigation_status VARCHAR(20) DEFAULT 'ongoing' CHECK (investigation_status IN (
        'ongoing', 'completed', 'escalated', 'external_investigation'
    )),
    external_investigators TEXT,
    
    -- Lessons learned and improvements
    lessons_learned TEXT,
    security_improvements TEXT,
    policy_changes TEXT,
    
    -- Legal and insurance
    legal_counsel_involved BOOLEAN DEFAULT false,
    insurance_claim_filed BOOLEAN DEFAULT false,
    regulatory_fines DECIMAL(12,2) DEFAULT 0,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Permanent retention for legal and compliance purposes
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '50 years')
);

-- =============================================================================
-- CONSENT TRACKING TABLE
-- =============================================================================
-- Track user consent for GDPR compliance
CREATE TABLE consent_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Data subject
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Consent details
    consent_type VARCHAR(100) NOT NULL,
    processing_purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    
    -- Consent status
    consent_given BOOLEAN NOT NULL,
    consent_method VARCHAR(50) CHECK (consent_method IN (
        'web_form', 'email_confirmation', 'phone_verbal', 'written_document', 'opt_in_checkbox'
    )),
    
    -- Legal basis
    lawful_basis VARCHAR(50) NOT NULL CHECK (lawful_basis IN (
        'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    )),
    
    -- Consent lifecycle
    consent_given_at TIMESTAMP WITH TIME ZONE,
    consent_withdrawn_at TIMESTAMP WITH TIME ZONE,
    consent_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Evidence preservation
    consent_evidence TEXT, -- How consent was obtained/withdrawn
    ip_address INET,
    user_agent TEXT,
    
    -- Withdrawal details
    withdrawal_method VARCHAR(50),
    withdrawal_reason TEXT,
    
    -- Current status
    is_active BOOLEAN GENERATED ALWAYS AS (
        consent_given = true AND 
        (consent_withdrawn_at IS NULL) AND 
        (consent_expires_at IS NULL OR consent_expires_at > NOW())
    ) STORED,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Long-term retention for compliance proof
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '15 years')
);

-- =============================================================================
-- DATA PROCESSING ACTIVITIES TABLE
-- =============================================================================
-- Record of Processing Activities (ROPA) as required by GDPR Article 30
CREATE TABLE data_processing_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Processing activity identification
    activity_name VARCHAR(255) NOT NULL,
    activity_description TEXT NOT NULL,
    activity_category VARCHAR(100) NOT NULL,
    
    -- Controller and processor information
    data_controller VARCHAR(255) NOT NULL DEFAULT 'Farewelly BV',
    data_processor VARCHAR(255),
    joint_controllers TEXT[],
    
    -- Data subjects and categories
    data_subject_categories TEXT[] NOT NULL, -- e.g., 'family_members', 'service_providers'
    data_categories TEXT[] NOT NULL, -- e.g., 'personal_details', 'financial_data'
    
    -- Processing purposes and legal basis
    processing_purposes TEXT[] NOT NULL,
    lawful_basis TEXT[] NOT NULL,
    
    -- Data sources and recipients
    data_sources TEXT[] NOT NULL,
    recipient_categories TEXT[],
    third_country_transfers BOOLEAN DEFAULT false,
    transfer_safeguards TEXT,
    
    -- Retention and deletion
    retention_period INTERVAL NOT NULL,
    deletion_criteria TEXT NOT NULL,
    
    -- Security measures
    technical_measures TEXT[] NOT NULL,
    organizational_measures TEXT[] NOT NULL,
    
    -- Data protection impact assessment
    dpia_required BOOLEAN DEFAULT false,
    dpia_completed BOOLEAN DEFAULT false,
    dpia_date DATE,
    dpia_outcome TEXT,
    
    -- Review and approval
    last_reviewed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_review_date DATE NOT NULL,
    approved_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Long-term retention for compliance
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '10 years')
);

-- =============================================================================
-- SYSTEM ACCESS LOG TABLE
-- =============================================================================
-- Detailed logging of system access for security monitoring
CREATE TABLE system_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User information
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    
    -- Access details
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'login', 'logout', 'session_timeout', 'password_reset', 'account_locked',
        'failed_login', 'suspicious_activity', 'concurrent_session'
    )),
    
    -- Authentication method
    auth_method VARCHAR(50) CHECK (auth_method IN (
        'password', 'oauth', 'sso', 'magic_link', 'two_factor', 'biometric'
    )),
    
    -- Session information
    session_duration_seconds INTEGER,
    concurrent_sessions INTEGER DEFAULT 1,
    
    -- Technical context
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    
    -- Geolocation
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Security indicators
    is_suspicious BOOLEAN DEFAULT false,
    risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    security_flags TEXT[],
    
    -- VPN/Proxy detection
    using_vpn BOOLEAN DEFAULT false,
    using_proxy BOOLEAN DEFAULT false,
    using_tor BOOLEAN DEFAULT false,
    
    -- Result
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security log retention (longer than standard)
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '7 years')
);

-- =============================================================================
-- REGULATORY COMPLIANCE EVENTS TABLE
-- =============================================================================
-- Track specific compliance events and regulatory requirements
CREATE TABLE regulatory_compliance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Compliance framework
    regulation VARCHAR(100) NOT NULL, -- e.g., 'GDPR', 'Wet op de Lijkbezorging', 'AVG'
    compliance_requirement VARCHAR(255) NOT NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
        'data_retention_review', 'consent_renewal', 'security_audit', 'privacy_assessment',
        'vendor_review', 'policy_update', 'training_completion', 'incident_response'
    )),
    
    -- Affected entities
    affected_users INTEGER DEFAULT 0,
    affected_systems TEXT[],
    affected_data_types TEXT[],
    
    -- Compliance status
    compliance_status VARCHAR(50) DEFAULT 'compliant' CHECK (compliance_status IN (
        'compliant', 'non_compliant', 'partial_compliance', 'under_review', 'remediation_required'
    )),
    
    -- Evidence and documentation
    evidence_location TEXT,
    supporting_documents TEXT[],
    compliance_notes TEXT,
    
    -- Responsible parties
    responsible_person_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    reviewed_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Timeline
    due_date DATE,
    completed_date DATE,
    next_review_date DATE,
    
    -- Remediation (if required)
    remediation_required BOOLEAN DEFAULT false,
    remediation_plan TEXT,
    remediation_deadline DATE,
    remediation_completed BOOLEAN DEFAULT false,
    
    -- External verification
    external_audit BOOLEAN DEFAULT false,
    auditor_name VARCHAR(255),
    audit_report_location TEXT,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Permanent retention for regulatory defense
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '20 years')
);

-- =============================================================================
-- TRIGGERS FOR AUDIT TABLES
-- =============================================================================

-- Update GDPR compliance log updated_at timestamp
CREATE TRIGGER update_gdpr_compliance_log_updated_at 
    BEFORE UPDATE ON gdpr_compliance_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update data breach log updated_at timestamp
CREATE TRIGGER update_data_breach_log_updated_at 
    BEFORE UPDATE ON data_breach_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update consent tracking updated_at timestamp
CREATE TRIGGER update_consent_tracking_updated_at 
    BEFORE UPDATE ON consent_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update data processing activities updated_at timestamp
CREATE TRIGGER update_data_processing_activities_updated_at 
    BEFORE UPDATE ON data_processing_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update regulatory compliance events updated_at timestamp
CREATE TRIGGER update_regulatory_compliance_events_updated_at 
    BEFORE UPDATE ON regulatory_compliance_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUDIT UTILITY FUNCTIONS
-- =============================================================================

-- Function to create audit log entry (to be called from application code)
CREATE OR REPLACE FUNCTION create_audit_log_entry(
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_user_id UUID,
    p_action VARCHAR(100),
    p_target_type VARCHAR(50),
    p_target_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_success BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        event_type, event_category, user_id, action, target_type, target_id,
        old_values, new_values, ip_address, success
    ) VALUES (
        p_event_type, p_event_category, p_user_id, p_action, p_target_type, p_target_id,
        p_old_values, p_new_values, p_ip_address, p_success
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up standard audit logs
    DELETE FROM audit_log WHERE retention_until < CURRENT_DATE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up system access logs
    DELETE FROM system_access_log WHERE retention_until < CURRENT_DATE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up consent tracking (only inactive, expired consents)
    DELETE FROM consent_tracking 
    WHERE retention_until < CURRENT_DATE 
    AND is_active = false;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;