-- =============================================================================
-- Migration 001: Initial Schema Setup
-- This migration sets up the complete Farewelly database schema
-- =============================================================================

-- Migration metadata
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES ('001', 'Initial schema setup with core entities, documents, and audit logging', NOW())
ON CONFLICT (version) DO NOTHING;

BEGIN;

-- =============================================================================
-- 1. CORE ENTITIES SETUP
-- =============================================================================

-- Execute core entities schema
\i '../schema/01_core_entities.sql'

-- =============================================================================
-- 2. DOCUMENT STORAGE SETUP
-- =============================================================================

-- Execute document storage schema
\i '../schema/02_document_storage.sql'

-- =============================================================================
-- 3. AUDIT LOGGING SETUP
-- =============================================================================

-- Execute audit logging schema
\i '../schema/03_audit_logging.sql'

-- =============================================================================
-- 4. PERFORMANCE INDEXES
-- =============================================================================

-- Execute performance indexes
\i '../indexes/performance_indexes.sql'

-- =============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Execute RLS policies
\i '../policies/row_level_security.sql'

-- =============================================================================
-- 6. INITIAL DATA SEEDING
-- =============================================================================

-- Update existing user_profiles table to ensure compatibility
-- Add any missing columns for enhanced functionality
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE user_profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'account_status') THEN
        ALTER TABLE user_profiles ADD COLUMN account_status VARCHAR(20) DEFAULT 'active' 
        CHECK (account_status IN ('active', 'suspended', 'deactivated'));
    END IF;
END
$$;

-- Create schema migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    checksum VARCHAR(64)
);

-- =============================================================================
-- 7. INITIAL SYSTEM CONFIGURATION
-- =============================================================================

-- Insert initial data processing activities (GDPR Article 30 compliance)
INSERT INTO data_processing_activities 
(activity_name, activity_description, activity_category, data_subject_categories, data_categories, processing_purposes, lawful_basis, data_sources, retention_period, deletion_criteria, technical_measures, organizational_measures, next_review_date)
VALUES 
(
    'Funeral Service Coordination',
    'Processing personal data for coordinating funeral services between families, directors, and venues',
    'Service Delivery',
    ARRAY['family_members', 'deceased_persons', 'service_providers'],
    ARRAY['contact_details', 'service_preferences', 'payment_information'],
    ARRAY['funeral_service_coordination', 'payment_processing', 'communication_facilitation'],
    ARRAY['contract', 'legitimate_interests'],
    ARRAY['user_registration', 'service_requests', 'communication_channels'],
    INTERVAL '7 years',
    'Automatic deletion after retention period unless legal hold applies',
    ARRAY['encryption_at_rest', 'encryption_in_transit', 'access_controls', 'audit_logging'],
    ARRAY['staff_training', 'privacy_policies', 'data_protection_procedures'],
    CURRENT_DATE + INTERVAL '1 year'
),
(
    'Document Storage and Management',
    'Secure storage and management of funeral-related documents with zero-knowledge encryption',
    'Document Management',
    ARRAY['family_members', 'legal_representatives'],
    ARRAY['identity_documents', 'legal_documents', 'financial_documents'],
    ARRAY['document_preservation', 'secure_sharing', 'compliance_support'],
    ARRAY['consent', 'contract'],
    ARRAY['document_uploads', 'digital_scanning'],
    INTERVAL '50 years',
    'User-controlled deletion or automatic deletion based on document type retention requirements',
    ARRAY['zero_knowledge_encryption', 'access_controls', 'backup_systems', 'audit_trails'],
    ARRAY['document_handling_procedures', 'security_training', 'access_management'],
    CURRENT_DATE + INTERVAL '1 year'
);

-- Insert initial regulatory compliance tracking
INSERT INTO regulatory_compliance_events 
(regulation, compliance_requirement, event_type, compliance_status, due_date, next_review_date)
VALUES 
(
    'GDPR',
    'Article 30 - Record of Processing Activities',
    'privacy_assessment',
    'compliant',
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '6 months'
),
(
    'Wet op de Lijkbezorging',
    'Funeral service provider registration and compliance',
    'vendor_review',
    'compliant',
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '6 months'
);

COMMIT;

-- =============================================================================
-- 8. POST-MIGRATION VALIDATION
-- =============================================================================

-- Validate that all tables were created successfully
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'deceased_persons', 'funeral_requests', 'venues', 'bookings', 
        'service_providers', 'communications', 'payments',
        'document_categories', 'document_vault', 'document_access_log',
        'document_sharing_permissions', 'document_processing_queue',
        'document_backup_metadata', 'document_sharing_tokens',
        'audit_log', 'gdpr_compliance_log', 'data_breach_log',
        'consent_tracking', 'data_processing_activities',
        'system_access_log', 'regulatory_compliance_events'
    ];
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                      WHERE table_schema = 'public' AND table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Migration failed: Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'Migration completed successfully: All % tables created', array_length(expected_tables, 1);
    END IF;
END
$$;

-- Validate that RLS is enabled on all tables
DO $$
DECLARE
    table_name TEXT;
    tables_without_rls TEXT[] := '{}';
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN ('schema_migrations', 'user_profiles')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables pt
            JOIN pg_class pc ON pt.tablename = pc.relname
            WHERE pt.schemaname = 'public' 
            AND pt.tablename = table_name
            AND pc.relrowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, table_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE WARNING 'Tables without RLS enabled: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'RLS validation passed: All tables have row level security enabled';
    END IF;
END
$$;

-- Log successful migration
INSERT INTO audit_log (
    event_type, event_category, action, target_type, target_description,
    success, ip_address
) VALUES (
    'schema_migration', 'system_admin', 'CREATE', 'database_schema', 
    'Initial schema migration 001 completed successfully',
    true, '127.0.0.1'::inet
);