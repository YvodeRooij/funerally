-- =============================================================================
-- Farewelly Performance Indexes
-- Comprehensive indexing strategy for optimal query performance
-- =============================================================================

-- =============================================================================
-- CORE ENTITIES INDEXES
-- =============================================================================

-- DECEASED PERSONS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_death_date 
    ON deceased_persons(death_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_bsn 
    ON deceased_persons(bsn) WHERE bsn IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_name_search 
    ON deceased_persons USING gin(to_tsvector('dutch', first_name || ' ' || last_name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_service_type 
    ON deceased_persons(preferred_service_type) WHERE preferred_service_type IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_retention 
    ON deceased_persons(retention_until) WHERE retention_until IS NOT NULL;

-- FUNERAL REQUESTS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_deceased 
    ON funeral_requests(deceased_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_primary_contact 
    ON funeral_requests(primary_contact_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_director 
    ON funeral_requests(assigned_director_id) WHERE assigned_director_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_status 
    ON funeral_requests(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_urgency 
    ON funeral_requests(urgency_level, funeral_deadline);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_deadline 
    ON funeral_requests(funeral_deadline ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_timeline 
    ON funeral_requests(death_registered_at, funeral_deadline);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_municipality 
    ON funeral_requests(preferred_municipality) WHERE preferred_municipality IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_assistance 
    ON funeral_requests(financial_assistance_needed) WHERE financial_assistance_needed = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_gdpr_retention 
    ON funeral_requests(data_retention_until);

-- VENUES TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_owner 
    ON venues(owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_location 
    ON venues(city, province);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_type_capacity 
    ON venues(venue_type, max_capacity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_status_approved 
    ON venues(status) WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_pricing 
    ON venues(base_price_per_hour ASC) WHERE status = 'approved';

-- Geospatial index for venue location searching
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_geolocation 
    ON venues USING gist(point(longitude, latitude)) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_accessibility 
    ON venues(wheelchair_accessible) WHERE wheelchair_accessible = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_amenities 
    ON venues USING gin(amenities);

-- BOOKINGS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_funeral_request 
    ON bookings(funeral_request_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_venue 
    ON bookings(venue_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_booked_by 
    ON bookings(booked_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_time 
    ON bookings(booking_date, start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status 
    ON bookings(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_venue_availability 
    ON bookings(venue_id, booking_date, start_time, end_time) 
    WHERE status IN ('confirmed', 'paid', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_payment_due 
    ON bookings(payment_due_date) WHERE payment_due_date IS NOT NULL;

-- SERVICE PROVIDERS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_user_profile 
    ON service_providers(user_profile_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_kvk 
    ON service_providers(kvk_number) WHERE kvk_number IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_status 
    ON service_providers(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_bgnu 
    ON service_providers(bgnu_member) WHERE bgnu_member = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_rating 
    ON service_providers(average_rating DESC, total_reviews DESC) 
    WHERE status = 'approved';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_regions 
    ON service_providers USING gin(service_regions);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_specializations 
    ON service_providers USING gin(specializations);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_providers_languages 
    ON service_providers USING gin(languages_spoken);

-- COMMUNICATIONS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_funeral_request 
    ON communications(funeral_request_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_sender 
    ON communications(sender_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_recipient 
    ON communications(recipient_id) WHERE recipient_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_type_status 
    ON communications(communication_type, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_timeline 
    ON communications(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communications_response_required 
    ON communications(response_required, response_deadline) 
    WHERE response_required = true;

-- PAYMENTS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_funeral_request 
    ON payments(funeral_request_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payer 
    ON payments(payer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking 
    ON payments(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status 
    ON payments(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_processor 
    ON payments(processor, processor_payment_id) WHERE processor IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_assistance_type 
    ON payments(assistance_type) WHERE assistance_type != 'none';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_due_date 
    ON payments(due_date ASC) WHERE due_date IS NOT NULL;

-- =============================================================================
-- DOCUMENT STORAGE INDEXES
-- =============================================================================

-- DOCUMENT VAULT TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_owner 
    ON document_vault(owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_funeral_request 
    ON document_vault(funeral_request_id) WHERE funeral_request_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_category 
    ON document_vault(category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_access_level 
    ON document_vault(access_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_sharing 
    ON document_vault(sharing_enabled, share_expires_at) 
    WHERE sharing_enabled = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_retention 
    ON document_vault(retention_until, auto_delete_enabled);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_legal_hold 
    ON document_vault(legal_hold) WHERE legal_hold = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_versions 
    ON document_vault(parent_document_id, version DESC) 
    WHERE parent_document_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_latest_versions 
    ON document_vault(owner_id, category_id) WHERE is_latest_version = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_vault_search_tags 
    ON document_vault USING gin(content_tags);

-- DOCUMENT ACCESS LOG TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_document 
    ON document_access_log(document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_user 
    ON document_access_log(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_timeline 
    ON document_access_log(accessed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_access_type 
    ON document_access_log(access_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_ip 
    ON document_access_log(ip_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_access_log_retention 
    ON document_access_log(retention_until);

-- DOCUMENT SHARING PERMISSIONS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_permissions_document 
    ON document_sharing_permissions(document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_permissions_granted_to 
    ON document_sharing_permissions(granted_to_id) WHERE granted_to_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_permissions_granted_by 
    ON document_sharing_permissions(granted_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_permissions_status 
    ON document_sharing_permissions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_permissions_expires 
    ON document_sharing_permissions(expires_at) WHERE expires_at IS NOT NULL;

-- DOCUMENT PROCESSING QUEUE TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_processing_queue_document 
    ON document_processing_queue(document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_processing_queue_status_priority 
    ON document_processing_queue(status, priority ASC) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_processing_queue_scheduled 
    ON document_processing_queue(scheduled_for ASC) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_processing_queue_type 
    ON document_processing_queue(processing_type);

-- DOCUMENT SHARING TOKENS TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_tokens_document 
    ON document_sharing_tokens(document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_tokens_created_by 
    ON document_sharing_tokens(created_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_tokens_status 
    ON document_sharing_tokens(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_sharing_tokens_expires 
    ON document_sharing_tokens(expires_at);

-- =============================================================================
-- AUDIT LOGGING INDEXES
-- =============================================================================

-- AUDIT LOG TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user 
    ON audit_log(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_timeline 
    ON audit_log(occurred_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_event_type 
    ON audit_log(event_type, event_category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_target 
    ON audit_log(target_type, target_id) WHERE target_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_ip_address 
    ON audit_log(ip_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_risk_level 
    ON audit_log(risk_level, anomaly_score DESC) WHERE risk_level IN ('high', 'critical');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_retention 
    ON audit_log(retention_until);

-- GDPR COMPLIANCE LOG TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gdpr_compliance_log_data_subject 
    ON gdpr_compliance_log(data_subject_id) WHERE data_subject_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gdpr_compliance_log_email 
    ON gdpr_compliance_log(data_subject_email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gdpr_compliance_log_activity_type 
    ON gdpr_compliance_log(activity_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gdpr_compliance_log_status 
    ON gdpr_compliance_log(response_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gdpr_compliance_log_deadline 
    ON gdpr_compliance_log(response_deadline ASC) 
    WHERE response_status NOT IN ('completed', 'rejected');

-- DATA BREACH LOG TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_breach_log_reference 
    ON data_breach_log(breach_reference);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_breach_log_severity 
    ON data_breach_log(severity_level, discovered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_breach_log_discovery 
    ON data_breach_log(discovered_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_breach_log_notification_deadline 
    ON data_breach_log(authority_notification_deadline) 
    WHERE requires_authority_notification = true AND authority_notified_at IS NULL;

-- CONSENT TRACKING TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_tracking_user 
    ON consent_tracking(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_tracking_type 
    ON consent_tracking(consent_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_tracking_active 
    ON consent_tracking(user_id, consent_type) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_tracking_expires 
    ON consent_tracking(consent_expires_at) 
    WHERE consent_expires_at IS NOT NULL AND is_active = true;

-- SYSTEM ACCESS LOG TABLE INDEXES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_user 
    ON system_access_log(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_timeline 
    ON system_access_log(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_access_type 
    ON system_access_log(access_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_ip 
    ON system_access_log(ip_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_suspicious 
    ON system_access_log(is_suspicious, risk_score DESC) WHERE is_suspicious = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_access_log_failed_logins 
    ON system_access_log(user_id, created_at DESC) 
    WHERE access_type = 'failed_login' AND success = false;

-- =============================================================================
-- USER PROFILES TABLE INDEXES (ENHANCING EXISTING)
-- =============================================================================

-- Add additional indexes for user profiles to support complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_type_created 
    ON user_profiles(user_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_company 
    ON user_profiles(company) WHERE company IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_phone 
    ON user_profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_specializations 
    ON user_profiles USING gin(specializations) WHERE specializations IS NOT NULL;

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Complex funeral request queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funeral_requests_search 
    ON funeral_requests(status, urgency_level, preferred_municipality, funeral_deadline);

-- Venue availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venue_booking_conflicts 
    ON bookings(venue_id, booking_date, status) 
    WHERE status IN ('confirmed', 'paid', 'in_progress');

-- Document security queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_security 
    ON document_vault(owner_id, access_level, sharing_enabled, legal_hold);

-- Audit trail queries for investigations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_investigation 
    ON audit_log(user_id, occurred_at DESC, event_category, success);

-- Payment processing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_processing 
    ON payments(status, due_date, payment_method) 
    WHERE status IN ('pending', 'processing');

-- =============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =============================================================================

-- Active sharing tokens only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_sharing_tokens 
    ON document_sharing_tokens(document_id, expires_at) 
    WHERE status = 'active' AND expires_at > NOW();

-- Pending GDPR requests that need attention
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_gdpr_requests 
    ON gdpr_compliance_log(response_deadline ASC, activity_type) 
    WHERE response_status IN ('received', 'processing') AND response_deadline > CURRENT_DATE;

-- High-risk audit events for security monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_risk_audit_events 
    ON audit_log(occurred_at DESC, event_type, user_id) 
    WHERE risk_level IN ('high', 'critical') AND occurred_at > (NOW() - INTERVAL '30 days');

-- Documents requiring deletion warning
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_deletion_warning 
    ON document_vault(retention_until, owner_id) 
    WHERE auto_delete_enabled = true 
    AND deletion_warning_sent = false 
    AND legal_hold = false 
    AND retention_until <= (CURRENT_DATE + INTERVAL '30 days');

-- =============================================================================
-- TEXT SEARCH INDEXES
-- =============================================================================

-- Full-text search for deceased persons
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deceased_persons_fulltext 
    ON deceased_persons USING gin(
        to_tsvector('dutch', 
            coalesce(first_name, '') || ' ' || 
            coalesce(last_name, '') || ' ' || 
            coalesce(maiden_name, '')
        )
    );

-- Full-text search for venues
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_fulltext 
    ON venues USING gin(
        to_tsvector('dutch', 
            coalesce(name, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(city, '')
        )
    );

-- =============================================================================
-- INDEX MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to analyze index usage and recommendations
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    usage_ratio numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexrelname::text,
        s.idx_tup_read,
        s.idx_tup_fetch,
        CASE 
            WHEN s.idx_tup_read = 0 THEN 0 
            ELSE round((s.idx_tup_fetch::numeric / s.idx_tup_read::numeric) * 100, 2)
        END as usage_ratio
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION identify_unused_indexes()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexrelname::text,
        pg_size_pretty(pg_relation_size(s.indexrelid))::text as index_size
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    AND s.idx_tup_read = 0
    AND s.idx_tup_fetch = 0
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;