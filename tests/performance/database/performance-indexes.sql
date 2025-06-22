-- DATABASE PERFORMANCE INDEXES FOR FAREWELLY
-- 
-- Essential indexes for optimal performance based on expected query patterns
-- Run these before performance testing for accurate results

-- =====================================================
-- USER PROFILES TABLE INDEXES
-- =====================================================

-- Primary email lookup (most common authentication query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profiles_email_idx 
ON user_profiles (email);

-- User type filtering (common for role-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profiles_user_type_idx 
ON user_profiles (user_type);

-- Location-based searches for venues and directors
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profiles_address_gin_idx 
ON user_profiles USING gin(to_tsvector('dutch', address));

-- Compound index for active user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profiles_type_email_idx 
ON user_profiles (user_type, email);

-- =====================================================
-- BOOKINGS TABLE INDEXES
-- =====================================================

-- Family bookings lookup (most common family query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_family_id_idx 
ON bookings (family_id);

-- Director bookings lookup (director dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_director_id_idx 
ON bookings (director_id);

-- Venue bookings lookup (venue dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_venue_id_idx 
ON bookings (venue_id);

-- Date-based queries (availability, scheduling)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_date_idx 
ON bookings (date);

-- Status filtering (pending, confirmed, completed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_status_idx 
ON bookings (status);

-- Compound index for family bookings by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_family_status_idx 
ON bookings (family_id, status);

-- Compound index for date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_date_status_idx 
ON bookings (date, status);

-- Recent bookings (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_created_at_idx 
ON bookings (created_at DESC);

-- Compound index for director client management
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_director_date_idx 
ON bookings (director_id, date DESC);

-- Venue availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_venue_date_time_idx 
ON bookings (venue_id, date, time);

-- =====================================================
-- DIRECTOR_CLIENTS TABLE INDEXES
-- =====================================================

-- Director's client list (primary director query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS director_clients_director_id_idx 
ON director_clients (director_id);

-- Client relationships lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS director_clients_family_id_idx 
ON director_clients (family_id);

-- Active relationships filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS director_clients_status_idx 
ON director_clients (relationship_status);

-- Compound index for active client management
CREATE INDEX CONCURRENTLY IF NOT EXISTS director_clients_director_status_idx 
ON director_clients (director_id, relationship_status);

-- GIN index for tags searching
CREATE INDEX CONCURRENTLY IF NOT EXISTS director_clients_tags_gin_idx 
ON director_clients USING gin(tags);

-- =====================================================
-- VENUE_AVAILABILITY TABLE INDEXES
-- =====================================================

-- Venue availability lookup (booking flow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS venue_availability_venue_id_idx 
ON venue_availability (venue_id);

-- Date range availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS venue_availability_date_idx 
ON venue_availability (date);

-- Compound index for venue booking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS venue_availability_venue_date_idx 
ON venue_availability (venue_id, date);

-- GIN index for time slots JSON queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS venue_availability_time_slots_gin_idx 
ON venue_availability USING gin(time_slots);

-- =====================================================
-- DOCUMENTS TABLE INDEXES
-- =====================================================

-- Family documents lookup (document vault)
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_family_id_idx 
ON documents (family_id);

-- Document type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_type_idx 
ON documents (type);

-- Active documents (not deleted)
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_deleted_at_idx 
ON documents (deleted_at) WHERE deleted_at IS NULL;

-- Compound index for family document management
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_family_type_idx 
ON documents (family_id, type) WHERE deleted_at IS NULL;

-- Full-text search on document content
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_filename_gin_idx 
ON documents USING gin(to_tsvector('dutch', filename));

-- Recent documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_created_at_idx 
ON documents (created_at DESC);

-- =====================================================
-- CHAT_MESSAGES TABLE INDEXES
-- =====================================================

-- Room messages lookup (chat interface)
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_messages_room_id_idx 
ON chat_messages (room_id);

-- Sender messages lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_messages_sender_id_idx 
ON chat_messages (sender_id);

-- Recent messages in room (most common chat query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_messages_room_created_idx 
ON chat_messages (room_id, created_at DESC);

-- Message type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_messages_type_idx 
ON chat_messages (type);

-- Unread messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_messages_read_status_idx 
ON chat_messages (read_status) WHERE read_status = false;

-- =====================================================
-- CHAT_ROOMS TABLE INDEXES
-- =====================================================

-- Room type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_rooms_type_idx 
ON chat_rooms (type);

-- Participants lookup (GIN for array operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_rooms_participants_gin_idx 
ON chat_rooms USING gin(participants);

-- Recent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_rooms_updated_at_idx 
ON chat_rooms (updated_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE INDEXES
-- =====================================================

-- User notifications lookup (notification center)
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_id_idx 
ON notifications (user_id);

-- Unread notifications (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_read_idx 
ON notifications (user_id, read) WHERE read = false;

-- Notification type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_type_idx 
ON notifications (type);

-- Recent notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_created_at_idx 
ON notifications (created_at DESC);

-- =====================================================
-- PAYMENTS TABLE INDEXES
-- =====================================================

-- Booking payments lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_booking_id_idx 
ON payments (booking_id);

-- Payment status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_status_idx 
ON payments (status);

-- Payment method analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_payment_method_idx 
ON payments (payment_method);

-- Revenue analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_created_at_idx 
ON payments (created_at);

-- Compound index for completed payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS payments_status_amount_idx 
ON payments (status, amount) WHERE status = 'completed';

-- =====================================================
-- AUDIT_LOGS TABLE INDEXES
-- =====================================================

-- Resource audit lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_resource_idx 
ON audit_logs (resource_type, resource_id);

-- User action audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_user_id_idx 
ON audit_logs (user_id);

-- Action type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_action_idx 
ON audit_logs (action);

-- Recent audit logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_created_at_idx 
ON audit_logs (created_at DESC);

-- =====================================================
-- PERFORMANCE ANALYSIS QUERIES
-- =====================================================

-- Query to check index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Query to identify slow queries
CREATE OR REPLACE VIEW slow_query_stats AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time,
    CASE 
        WHEN mean_time > 1000 THEN 'VERY_SLOW'
        WHEN mean_time > 500 THEN 'SLOW'
        WHEN mean_time > 100 THEN 'MODERATE'
        ELSE 'FAST'
    END as performance_category
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_time DESC;

-- Query to check table bloat
CREATE OR REPLACE VIEW table_bloat_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup::float) * 100
        ELSE 0
    END as bloat_percentage
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY bloat_percentage DESC;

-- =====================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- =====================================================

-- Function to get current connection pool status
CREATE OR REPLACE FUNCTION get_connection_pool_stats()
RETURNS TABLE (
    total_connections int,
    active_connections int,
    idle_connections int,
    max_connections int,
    utilization_percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        count(*)::int as total_connections,
        count(CASE WHEN state = 'active' THEN 1 END)::int as active_connections,
        count(CASE WHEN state = 'idle' THEN 1 END)::int as idle_connections,
        current_setting('max_connections')::int as max_connections,
        (count(*)::numeric / current_setting('max_connections')::numeric * 100) as utilization_percentage
    FROM pg_stat_activity;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache hit ratios
CREATE OR REPLACE FUNCTION get_cache_hit_ratios()
RETURNS TABLE (
    table_name text,
    heap_hit_ratio numeric,
    index_hit_ratio numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        relname::text as table_name,
        CASE 
            WHEN (heap_blks_hit + heap_blks_read) > 0 
            THEN (heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric * 100)
            ELSE 0
        END as heap_hit_ratio,
        CASE 
            WHEN (idx_blks_hit + idx_blks_read) > 0 
            THEN (idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read)::numeric * 100)
            ELSE 0
        END as index_hit_ratio
    FROM pg_statio_user_tables
    ORDER BY heap_hit_ratio DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get query performance summary
CREATE OR REPLACE FUNCTION get_query_performance_summary()
RETURNS TABLE (
    query_type text,
    avg_duration_ms numeric,
    max_duration_ms numeric,
    call_count bigint,
    performance_rating text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query ILIKE '%SELECT%FROM%user_profiles%' THEN 'user_profile_queries'
            WHEN query ILIKE '%SELECT%FROM%bookings%' THEN 'booking_queries'
            WHEN query ILIKE '%SELECT%FROM%documents%' THEN 'document_queries'
            WHEN query ILIKE '%SELECT%FROM%chat_messages%' THEN 'chat_queries'
            WHEN query ILIKE '%INSERT%' THEN 'insert_operations'
            WHEN query ILIKE '%UPDATE%' THEN 'update_operations'
            WHEN query ILIKE '%DELETE%' THEN 'delete_operations'
            ELSE 'other_queries'
        END as query_type,
        ROUND(mean_time, 2) as avg_duration_ms,
        ROUND(max_time, 2) as max_duration_ms,
        calls as call_count,
        CASE 
            WHEN mean_time > 1000 THEN 'NEEDS_OPTIMIZATION'
            WHEN mean_time > 500 THEN 'MONITOR_CLOSELY'
            WHEN mean_time > 100 THEN 'ACCEPTABLE'
            ELSE 'GOOD'
        END as performance_rating
    FROM pg_stat_statements
    WHERE calls > 5
    ORDER BY mean_time DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Query to identify missing indexes (run after performance tests)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Query to identify unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query for vacuum and analyze recommendations
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    CASE 
        WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup::float) * 100
        ELSE 0
    END as dead_tuple_percentage,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000 OR (n_live_tup > 0 AND (n_dead_tup::float / n_live_tup::float) > 0.1)
ORDER BY dead_tuple_percentage DESC;