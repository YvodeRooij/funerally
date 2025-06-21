-- =============================================================================
-- Farewelly Row Level Security (RLS) Policies
-- Comprehensive access control for all database tables
-- =============================================================================

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

-- Core entities
ALTER TABLE deceased_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Document storage
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sharing_tokens ENABLE ROW LEVEL SECURITY;

-- Audit logging
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_compliance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_breach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_compliance_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- UTILITY FUNCTIONS FOR RLS
-- =============================================================================

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'user_id', '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user type from JWT
CREATE OR REPLACE FUNCTION get_current_user_type() 
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'user_type', '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user email from JWT
CREATE OR REPLACE FUNCTION get_current_user_email() 
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'email', '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'is_admin')::boolean, 
        false
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is service provider
CREATE OR REPLACE FUNCTION is_service_provider() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_type() = 'director';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is venue owner
CREATE OR REPLACE FUNCTION is_venue_owner() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_type() = 'venue';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is family member
CREATE OR REPLACE FUNCTION is_family_member() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_type() = 'family';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USER PROFILES RLS POLICIES (ENHANCING EXISTING)
-- =============================================================================

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Enhanced user profile policies
CREATE POLICY "Users can view own profile or admins can view all" ON user_profiles
    FOR SELECT USING (
        get_current_user_id() = id OR is_admin()
    );

-- Service providers can view basic info of family members they're assigned to
CREATE POLICY "Service providers can view assigned family profiles" ON user_profiles
    FOR SELECT USING (
        user_type = 'family' AND
        is_service_provider() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.primary_contact_id = user_profiles.id
            AND fr.assigned_director_id = get_current_user_id()
        )
    );

-- Venue owners can view basic info of users who book their venues
CREATE POLICY "Venue owners can view booking user profiles" ON user_profiles
    FOR SELECT USING (
        is_venue_owner() AND
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE b.booked_by_id = user_profiles.id
            AND v.owner_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (get_current_user_id() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (get_current_user_id() = id);

-- =============================================================================
-- DECEASED PERSONS RLS POLICIES
-- =============================================================================

-- Family members can view deceased persons linked to their funeral requests
CREATE POLICY "Family can view their deceased persons" ON deceased_persons
    FOR SELECT USING (
        is_family_member() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.deceased_id = deceased_persons.id
            AND fr.primary_contact_id = get_current_user_id()
        )
    );

-- Service providers can view deceased persons for their assigned cases
CREATE POLICY "Service providers can view assigned deceased persons" ON deceased_persons
    FOR SELECT USING (
        is_service_provider() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.deceased_id = deceased_persons.id
            AND fr.assigned_director_id = get_current_user_id()
        )
    );

-- Family members can create deceased persons
CREATE POLICY "Family can create deceased persons" ON deceased_persons
    FOR INSERT WITH CHECK (is_family_member());

-- Family members can update their deceased persons
CREATE POLICY "Family can update their deceased persons" ON deceased_persons
    FOR UPDATE USING (
        is_family_member() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.deceased_id = deceased_persons.id
            AND fr.primary_contact_id = get_current_user_id()
        )
    );

-- Admins can view all deceased persons
CREATE POLICY "Admins can view all deceased persons" ON deceased_persons
    FOR ALL USING (is_admin());

-- =============================================================================
-- FUNERAL REQUESTS RLS POLICIES
-- =============================================================================

-- Family members can view their own funeral requests
CREATE POLICY "Family can view own funeral requests" ON funeral_requests
    FOR SELECT USING (
        is_family_member() AND primary_contact_id = get_current_user_id()
    );

-- Service providers can view their assigned funeral requests
CREATE POLICY "Service providers can view assigned requests" ON funeral_requests
    FOR SELECT USING (
        is_service_provider() AND assigned_director_id = get_current_user_id()
    );

-- Family members can create funeral requests
CREATE POLICY "Family can create funeral requests" ON funeral_requests
    FOR INSERT WITH CHECK (
        is_family_member() AND primary_contact_id = get_current_user_id()
    );

-- Family and assigned service providers can update funeral requests
CREATE POLICY "Family and assigned providers can update requests" ON funeral_requests
    FOR UPDATE USING (
        (is_family_member() AND primary_contact_id = get_current_user_id()) OR
        (is_service_provider() AND assigned_director_id = get_current_user_id())
    );

-- Admins can view all funeral requests
CREATE POLICY "Admins can view all funeral requests" ON funeral_requests
    FOR ALL USING (is_admin());

-- =============================================================================
-- VENUES RLS POLICIES
-- =============================================================================

-- Everyone can view approved venues (public marketplace)
CREATE POLICY "Everyone can view approved venues" ON venues
    FOR SELECT USING (status = 'approved');

-- Venue owners can view their own venues
CREATE POLICY "Venue owners can view own venues" ON venues
    FOR SELECT USING (
        is_venue_owner() AND owner_id = get_current_user_id()
    );

-- Venue owners can create venues
CREATE POLICY "Venue owners can create venues" ON venues
    FOR INSERT WITH CHECK (
        is_venue_owner() AND owner_id = get_current_user_id()
    );

-- Venue owners can update their own venues
CREATE POLICY "Venue owners can update own venues" ON venues
    FOR UPDATE USING (
        is_venue_owner() AND owner_id = get_current_user_id()
    );

-- Admins can view and manage all venues
CREATE POLICY "Admins can manage all venues" ON venues
    FOR ALL USING (is_admin());

-- =============================================================================
-- BOOKINGS RLS POLICIES
-- =============================================================================

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (booked_by_id = get_current_user_id());

-- Venue owners can view bookings for their venues
CREATE POLICY "Venue owners can view venue bookings" ON bookings
    FOR SELECT USING (
        is_venue_owner() AND
        EXISTS (
            SELECT 1 FROM venues v
            WHERE v.id = bookings.venue_id
            AND v.owner_id = get_current_user_id()
        )
    );

-- Service providers can view bookings for their assigned funeral requests
CREATE POLICY "Service providers can view assigned bookings" ON bookings
    FOR SELECT USING (
        is_service_provider() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.id = bookings.funeral_request_id
            AND fr.assigned_director_id = get_current_user_id()
        )
    );

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (booked_by_id = get_current_user_id());

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (booked_by_id = get_current_user_id());

-- Venue owners can update bookings for their venues (status changes)
CREATE POLICY "Venue owners can update venue bookings" ON bookings
    FOR UPDATE USING (
        is_venue_owner() AND
        EXISTS (
            SELECT 1 FROM venues v
            WHERE v.id = bookings.venue_id
            AND v.owner_id = get_current_user_id()
        )
    );

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
    FOR ALL USING (is_admin());

-- =============================================================================
-- SERVICE PROVIDERS RLS POLICIES
-- =============================================================================

-- Everyone can view approved service providers
CREATE POLICY "Everyone can view approved service providers" ON service_providers
    FOR SELECT USING (status = 'approved');

-- Service providers can view their own profile
CREATE POLICY "Service providers can view own profile" ON service_providers
    FOR SELECT USING (
        is_service_provider() AND user_profile_id = get_current_user_id()
    );

-- Service providers can create their own profile
CREATE POLICY "Service providers can create own profile" ON service_providers
    FOR INSERT WITH CHECK (
        is_service_provider() AND user_profile_id = get_current_user_id()
    );

-- Service providers can update their own profile
CREATE POLICY "Service providers can update own profile" ON service_providers
    FOR UPDATE USING (
        is_service_provider() AND user_profile_id = get_current_user_id()
    );

-- Admins can manage all service providers
CREATE POLICY "Admins can manage all service providers" ON service_providers
    FOR ALL USING (is_admin());

-- =============================================================================
-- COMMUNICATIONS RLS POLICIES
-- =============================================================================

-- Users can view communications they sent or received
CREATE POLICY "Users can view own communications" ON communications
    FOR SELECT USING (
        sender_id = get_current_user_id() OR 
        recipient_id = get_current_user_id()
    );

-- Users can view communications for their funeral requests
CREATE POLICY "Users can view funeral request communications" ON communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.id = communications.funeral_request_id
            AND (fr.primary_contact_id = get_current_user_id() OR 
                 fr.assigned_director_id = get_current_user_id())
        )
    );

-- Users can create communications
CREATE POLICY "Users can create communications" ON communications
    FOR INSERT WITH CHECK (sender_id = get_current_user_id());

-- Users can update their own communications
CREATE POLICY "Users can update own communications" ON communications
    FOR UPDATE USING (sender_id = get_current_user_id());

-- Admins can view all communications
CREATE POLICY "Admins can view all communications" ON communications
    FOR ALL USING (is_admin());

-- =============================================================================
-- PAYMENTS RLS POLICIES
-- =============================================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (payer_id = get_current_user_id());

-- Service providers can view payments for their assigned cases
CREATE POLICY "Service providers can view assigned payments" ON payments
    FOR SELECT USING (
        is_service_provider() AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.id = payments.funeral_request_id
            AND fr.assigned_director_id = get_current_user_id()
        )
    );

-- Users can create payments
CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (payer_id = get_current_user_id());

-- Users can update their own payments
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (payer_id = get_current_user_id());

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
    FOR ALL USING (is_admin());

-- =============================================================================
-- DOCUMENT STORAGE RLS POLICIES
-- =============================================================================

-- Document categories are public (read-only)
CREATE POLICY "Everyone can view document categories" ON document_categories
    FOR SELECT USING (true);

-- Only admins can modify document categories
CREATE POLICY "Admins can modify document categories" ON document_categories
    FOR ALL USING (is_admin());

-- Document vault access
CREATE POLICY "Users can view own documents" ON document_vault
    FOR SELECT USING (owner_id = get_current_user_id());

-- Users can view documents shared with them
CREATE POLICY "Users can view shared documents" ON document_vault
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_sharing_permissions dsp
            WHERE dsp.document_id = document_vault.id
            AND dsp.granted_to_id = get_current_user_id()
            AND dsp.status = 'active'
            AND (dsp.expires_at IS NULL OR dsp.expires_at > NOW())
        )
    );

-- Service providers can view documents for their assigned cases
CREATE POLICY "Service providers can view case documents" ON document_vault
    FOR SELECT USING (
        is_service_provider() AND
        funeral_request_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM funeral_requests fr
            WHERE fr.id = document_vault.funeral_request_id
            AND fr.assigned_director_id = get_current_user_id()
        )
    );

-- Users can create documents
CREATE POLICY "Users can create documents" ON document_vault
    FOR INSERT WITH CHECK (owner_id = get_current_user_id());

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON document_vault
    FOR UPDATE USING (owner_id = get_current_user_id());

-- Users can delete their own documents (unless under legal hold)
CREATE POLICY "Users can delete own documents" ON document_vault
    FOR DELETE USING (
        owner_id = get_current_user_id() AND legal_hold = false
    );

-- Document access log - users can view logs for their documents
CREATE POLICY "Users can view own document access logs" ON document_access_log
    FOR SELECT USING (
        user_id = get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM document_vault dv
            WHERE dv.id = document_access_log.document_id
            AND dv.owner_id = get_current_user_id()
        )
    );

-- Document sharing permissions
CREATE POLICY "Users can manage sharing for own documents" ON document_sharing_permissions
    FOR ALL USING (
        granted_by_id = get_current_user_id() OR
        granted_to_id = get_current_user_id() OR
        EXISTS (
            SELECT 1 FROM document_vault dv
            WHERE dv.id = document_sharing_permissions.document_id
            AND dv.owner_id = get_current_user_id()
        )
    );

-- =============================================================================
-- AUDIT LOGGING RLS POLICIES
-- =============================================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_log
    FOR SELECT USING (user_id = get_current_user_id());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_log
    FOR SELECT USING (is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (true);

-- GDPR compliance log - users can view their own entries
CREATE POLICY "Users can view own GDPR logs" ON gdpr_compliance_log
    FOR SELECT USING (data_subject_id = get_current_user_id());

-- Admins can view all GDPR logs
CREATE POLICY "Admins can view all GDPR logs" ON gdpr_compliance_log
    FOR ALL USING (is_admin());

-- Data breach log - only admins can view
CREATE POLICY "Only admins can view data breach logs" ON data_breach_log
    FOR ALL USING (is_admin());

-- Consent tracking - users can view their own consent records
CREATE POLICY "Users can view own consent records" ON consent_tracking
    FOR SELECT USING (user_id = get_current_user_id());

-- Users can create their own consent records
CREATE POLICY "Users can create own consent records" ON consent_tracking
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Users can update their own consent records
CREATE POLICY "Users can update own consent records" ON consent_tracking
    FOR UPDATE USING (user_id = get_current_user_id());

-- System access log - users can view their own access logs
CREATE POLICY "Users can view own access logs" ON system_access_log
    FOR SELECT USING (user_id = get_current_user_id());

-- Admins can view all access logs
CREATE POLICY "Admins can view all access logs" ON system_access_log
    FOR SELECT USING (is_admin());

-- System can insert access logs
CREATE POLICY "System can insert access logs" ON system_access_log
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- SECURITY FUNCTIONS FOR DOCUMENT SHARING
-- =============================================================================

-- Function to check if user can access document via sharing token
CREATE OR REPLACE FUNCTION can_access_document_via_token(
    p_document_id UUID,
    p_token UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM document_sharing_tokens dst
        WHERE dst.token = p_token
        AND dst.document_id = p_document_id
        AND dst.status = 'active'
        AND dst.expires_at > NOW()
        AND dst.current_uses < dst.max_uses
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission to share document
CREATE OR REPLACE FUNCTION can_share_document(
    p_document_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM document_vault dv
        WHERE dv.id = p_document_id
        AND dv.owner_id = p_user_id
        AND dv.sharing_enabled = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECURITY DEFINER FUNCTIONS FOR AUDIT LOGGING
-- =============================================================================

-- Function to log user actions (bypasses RLS for system logging)
CREATE OR REPLACE FUNCTION log_user_action(
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_action VARCHAR(100),
    p_target_type VARCHAR(50),
    p_target_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        event_type, event_category, user_id, action, target_type, target_id,
        old_values, new_values, ip_address, success
    ) VALUES (
        p_event_type, p_event_category, get_current_user_id(), p_action, 
        p_target_type, p_target_id, p_old_values, p_new_values, p_ip_address, true
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- EMERGENCY ACCESS PROCEDURES
-- =============================================================================

-- Function for emergency access (requires special role)
CREATE OR REPLACE FUNCTION emergency_access_override()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has emergency access role
    RETURN EXISTS (
        SELECT 1 FROM pg_roles
        WHERE rolname = current_user
        AND rolname IN ('emergency_access', 'system_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- POLICY VALIDATION AND TESTING
-- =============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(
    table_name text,
    policy_name text,
    policy_type text,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        pol.polname as policy_name,
        CASE 
            WHEN pol.polcmd = '*' THEN 'ALL'
            WHEN pol.polcmd = 'r' THEN 'SELECT'
            WHEN pol.polcmd = 'a' THEN 'INSERT'
            WHEN pol.polcmd = 'w' THEN 'UPDATE'
            WHEN pol.polcmd = 'd' THEN 'DELETE'
        END as policy_type,
        CASE 
            WHEN pol.polpermissive THEN 'PERMISSIVE'
            ELSE 'RESTRICTIVE'
        END as status
    FROM pg_policies pol
    WHERE pol.schemaname = 'public'
    ORDER BY pol.tablename, pol.polname;
END;
$$ LANGUAGE plpgsql;