-- =============================================================================
-- Rollback Script for Migration 001: Initial Schema Setup
-- This script safely removes all database objects created in migration 001
-- =============================================================================

BEGIN;

-- Log rollback attempt
INSERT INTO audit_log (
    event_type, event_category, action, target_type, target_description,
    success, ip_address
) VALUES (
    'schema_rollback', 'system_admin', 'DELETE', 'database_schema', 
    'Starting rollback of migration 001',
    true, '127.0.0.1'::inet
);

-- =============================================================================
-- 1. DROP FUNCTIONS (ORDER MATTERS)
-- =============================================================================

-- Drop utility functions
DROP FUNCTION IF EXISTS test_rls_policies();
DROP FUNCTION IF EXISTS emergency_access_override();
DROP FUNCTION IF EXISTS log_user_action(VARCHAR(100), VARCHAR(50), VARCHAR(100), VARCHAR(50), UUID, JSONB, JSONB, INET);
DROP FUNCTION IF EXISTS can_share_document(UUID, UUID);
DROP FUNCTION IF EXISTS can_access_document_via_token(UUID, UUID);
DROP FUNCTION IF EXISTS cleanup_expired_audit_logs();
DROP FUNCTION IF EXISTS create_audit_log_entry(VARCHAR(100), VARCHAR(50), UUID, VARCHAR(100), VARCHAR(50), UUID, JSONB, JSONB, INET, BOOLEAN);
DROP FUNCTION IF EXISTS analyze_index_usage();
DROP FUNCTION IF EXISTS identify_unused_indexes();
DROP FUNCTION IF EXISTS mark_documents_for_deletion();
DROP FUNCTION IF EXISTS cleanup_old_access_logs();
DROP FUNCTION IF EXISTS expire_sharing_tokens();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop RLS utility functions
DROP FUNCTION IF EXISTS is_family_member();
DROP FUNCTION IF EXISTS is_venue_owner();
DROP FUNCTION IF EXISTS is_service_provider();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_current_user_email();
DROP FUNCTION IF EXISTS get_current_user_type();
DROP FUNCTION IF EXISTS get_current_user_id();

-- =============================================================================
-- 2. DROP VIEWS (IF ANY WERE CREATED)
-- =============================================================================

-- Drop any views that might have been created
-- (None in current schema, but included for completeness)

-- =============================================================================
-- 3. DROP TABLES (IN REVERSE DEPENDENCY ORDER)
-- =============================================================================

-- Drop audit logging tables
DROP TABLE IF EXISTS regulatory_compliance_events CASCADE;
DROP TABLE IF EXISTS system_access_log CASCADE;
DROP TABLE IF EXISTS data_processing_activities CASCADE;
DROP TABLE IF EXISTS consent_tracking CASCADE;
DROP TABLE IF EXISTS data_breach_log CASCADE;
DROP TABLE IF EXISTS gdpr_compliance_log CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;

-- Drop document storage tables
DROP TABLE IF EXISTS document_sharing_tokens CASCADE;
DROP TABLE IF EXISTS document_backup_metadata CASCADE;
DROP TABLE IF EXISTS document_processing_queue CASCADE;
DROP TABLE IF EXISTS document_sharing_permissions CASCADE;
DROP TABLE IF EXISTS document_access_log CASCADE;
DROP TABLE IF EXISTS document_vault CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;

-- Drop core entity tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS funeral_requests CASCADE;
DROP TABLE IF EXISTS deceased_persons CASCADE;

-- =============================================================================
-- 4. REVERT USER_PROFILES TABLE CHANGES
-- =============================================================================

-- Remove columns that were added to user_profiles
DO $$
BEGIN
    -- Remove is_admin column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE user_profiles DROP COLUMN is_admin;
    END IF;
    
    -- Remove last_login_at column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE user_profiles DROP COLUMN last_login_at;
    END IF;
    
    -- Remove account_status column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_profiles' AND column_name = 'account_status') THEN
        ALTER TABLE user_profiles DROP COLUMN account_status;
    END IF;
END
$$;

-- =============================================================================
-- 5. DROP EXTENSIONS (IF THEY WERE CREATED)
-- =============================================================================

-- Note: Only drop extensions if they were created by this migration
-- and are not used by other parts of the system
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- =============================================================================
-- 6. UPDATE MIGRATION TRACKING
-- =============================================================================

-- Mark migration as rolled back
UPDATE schema_migrations 
SET rolled_back_at = NOW() 
WHERE version = '001';

-- Log successful rollback
DO $$
BEGIN
    -- Check if audit_log table still exists before trying to insert
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
        INSERT INTO audit_log (
            event_type, event_category, action, target_type, target_description,
            success, ip_address
        ) VALUES (
            'schema_rollback', 'system_admin', 'DELETE', 'database_schema', 
            'Migration 001 rollback completed successfully',
            true, '127.0.0.1'::inet
        );
    END IF;
END
$$;

COMMIT;

-- =============================================================================
-- 7. POST-ROLLBACK VALIDATION
-- =============================================================================

-- Validate that all tables were removed successfully
DO $$
DECLARE
    removed_tables TEXT[] := ARRAY[
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
    remaining_tables TEXT[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY removed_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = table_name) THEN
            remaining_tables := array_append(remaining_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(remaining_tables, 1) > 0 THEN
        RAISE WARNING 'Rollback incomplete: Remaining tables: %', array_to_string(remaining_tables, ', ');
    ELSE
        RAISE NOTICE 'Rollback completed successfully: All migration 001 tables removed';
    END IF;
END
$$;

-- Final success message
RAISE NOTICE 'Migration 001 rollback completed. Database restored to pre-migration state.';