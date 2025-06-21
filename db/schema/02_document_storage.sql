-- =============================================================================
-- Farewelly Document Storage Schema with Zero-Knowledge Encryption
-- This file contains the database schema for secure document storage
-- =============================================================================

-- =============================================================================
-- DOCUMENT CATEGORIES TABLE
-- =============================================================================
-- Predefined categories for document organization and retention policies
CREATE TABLE document_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Category information
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Dutch legal document types
    dutch_legal_type VARCHAR(100), -- e.g., 'overlijdensakte', 'uittreksel_basisregistratie'
    
    -- Retention and compliance
    retention_period INTERVAL NOT NULL DEFAULT INTERVAL '7 years', -- Default tax requirement
    mandatory_for_funeral BOOLEAN DEFAULT false,
    
    -- Security classification
    sensitivity_level VARCHAR(20) DEFAULT 'high' CHECK (sensitivity_level IN ('low', 'medium', 'high', 'critical')),
    encryption_required BOOLEAN DEFAULT true,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Dutch funeral document categories
INSERT INTO document_categories (name, description, dutch_legal_type, retention_period, mandatory_for_funeral, sensitivity_level) VALUES
('Death Certificate', 'Official death certificate (Overlijdensakte)', 'overlijdensakte', INTERVAL '50 years', true, 'critical'),
('Birth Certificate', 'Birth certificate of deceased', 'geboorteakte', INTERVAL '50 years', false, 'high'),
('ID Document', 'Identity document of deceased', 'identiteitsbewijs', INTERVAL '7 years', true, 'high'),
('Medical Certificate', 'Medical certificate of death cause', 'medische_verklaring', INTERVAL '30 years', true, 'critical'),
('Insurance Policy', 'Funeral/life insurance documents', 'verzekeringspolis', INTERVAL '10 years', false, 'high'),
('Will/Testament', 'Last will and testament', 'testament', INTERVAL '30 years', false, 'critical'),
('Financial Documents', 'Bank statements, financial records', 'financiele_documenten', INTERVAL '7 years', false, 'medium'),
('Marriage Certificate', 'Marriage certificate if applicable', 'huwelijksakte', INTERVAL '50 years', false, 'high'),
('Power of Attorney', 'Legal power of attorney documents', 'volmacht', INTERVAL '10 years', false, 'high'),
('Municipal Permits', 'Burial/cremation permits', 'gemeentelijke_vergunningen', INTERVAL '10 years', true, 'high'),
('Photos/Memories', 'Personal photos and memory items', 'herinneringen', INTERVAL '50 years', false, 'low'),
('Correspondence', 'Letters, emails, communications', 'correspondentie', INTERVAL '7 years', false, 'medium');

-- =============================================================================
-- DOCUMENT VAULT TABLE
-- =============================================================================
-- Core document storage with zero-knowledge encryption
CREATE TABLE document_vault (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    funeral_request_id UUID REFERENCES funeral_requests(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES document_categories(id) ON DELETE RESTRICT,
    
    -- Document metadata (not encrypted)
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Zero-knowledge encryption fields
    encrypted_content BYTEA NOT NULL, -- The actual encrypted file content
    client_encrypted_key TEXT NOT NULL, -- Key encrypted with client's password (never stored in plaintext)
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM' NOT NULL,
    encryption_iv BYTEA NOT NULL, -- Initialization vector
    
    -- Document hash verification (on encrypted content)
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity verification
    
    -- Access control
    access_level VARCHAR(20) DEFAULT 'private' CHECK (access_level IN ('private', 'family', 'provider', 'legal')),
    
    -- Sharing and access tokens
    sharing_enabled BOOLEAN DEFAULT false,
    share_token UUID, -- Unique token for temporary sharing
    share_expires_at TIMESTAMP WITH TIME ZONE,
    max_share_downloads INTEGER DEFAULT 1,
    current_share_downloads INTEGER DEFAULT 0,
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES document_vault(id) ON DELETE CASCADE,
    is_latest_version BOOLEAN DEFAULT true,
    
    -- Compliance and legal
    legal_hold BOOLEAN DEFAULT false, -- Prevent deletion for legal reasons
    legal_hold_reason TEXT,
    legal_hold_until TIMESTAMP WITH TIME ZONE,
    
    -- Retention management
    retention_until DATE NOT NULL,
    auto_delete_enabled BOOLEAN DEFAULT true,
    deletion_warning_sent BOOLEAN DEFAULT false,
    
    -- OCR and content analysis (on encrypted content)
    ocr_processed BOOLEAN DEFAULT false,
    ocr_text_hash VARCHAR(64), -- Hash of OCR text (for search without exposure)
    content_tags TEXT[], -- Searchable tags (non-sensitive)
    
    -- Audit trail
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT valid_share_settings CHECK (
        (sharing_enabled = false) OR 
        (sharing_enabled = true AND share_token IS NOT NULL AND share_expires_at IS NOT NULL)
    ),
    CONSTRAINT valid_share_downloads CHECK (current_share_downloads <= max_share_downloads)
);

-- =============================================================================
-- DOCUMENT ACCESS LOG TABLE
-- =============================================================================
-- Comprehensive audit trail for document access
CREATE TABLE document_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Access details
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'view', 'download', 'share', 'update', 'delete', 'upload_version', 'metadata_update'
    )),
    
    -- Access method
    access_method VARCHAR(50) CHECK (access_method IN (
        'direct_login', 'share_token', 'provider_access', 'admin_access', 'api_access'
    )),
    
    -- Technical details
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Share token access (if applicable)
    share_token_used UUID,
    
    -- Geolocation (for security)
    country_code VARCHAR(2),
    city VARCHAR(100),
    
    -- Success/failure tracking
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    
    -- Administrative
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Compliance retention (longer than document retention)
    retention_until DATE DEFAULT (CURRENT_DATE + INTERVAL '10 years')
);

-- =============================================================================
-- DOCUMENT SHARING PERMISSIONS TABLE
-- =============================================================================
-- Granular permissions for document sharing
CREATE TABLE document_sharing_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    granted_to_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    granted_by_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Permission details
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN (
        'view_only', 'download', 'share', 'comment', 'full_access'
    )),
    
    -- Time-limited access
    expires_at TIMESTAMP WITH TIME ZONE,
    max_downloads INTEGER DEFAULT 1,
    current_downloads INTEGER DEFAULT 0,
    
    -- Purpose and context
    purpose VARCHAR(255) NOT NULL, -- Why this access was granted
    context VARCHAR(100) CHECK (context IN (
        'funeral_planning', 'legal_requirement', 'insurance_claim', 'family_sharing', 'provider_coordination'
    )),
    
    -- Notification settings
    notify_on_access BOOLEAN DEFAULT true,
    access_notifications_sent INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'suspended')),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by_id UUID REFERENCES user_profiles(id),
    revoked_reason TEXT,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_download_limits CHECK (current_downloads <= max_downloads),
    CONSTRAINT no_self_permission CHECK (granted_to_id != granted_by_id)
);

-- =============================================================================
-- DOCUMENT PROCESSING QUEUE TABLE
-- =============================================================================
-- Queue for background document processing (OCR, virus scanning, etc.)
CREATE TABLE document_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    
    -- Processing details
    processing_type VARCHAR(50) NOT NULL CHECK (processing_type IN (
        'virus_scan', 'ocr_extraction', 'thumbnail_generation', 'metadata_extraction', 
        'content_analysis', 'encryption_validation'
    )),
    
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'skipped'
    )),
    
    -- Processing results
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    
    -- Results (encrypted if sensitive)
    processing_result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Administrative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENT BACKUP METADATA TABLE
-- =============================================================================
-- Track document backups for disaster recovery
CREATE TABLE document_backup_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    
    -- Backup details
    backup_location VARCHAR(255) NOT NULL, -- Cloud storage location
    backup_provider VARCHAR(100) NOT NULL, -- AWS S3, Google Cloud, etc.
    backup_region VARCHAR(100),
    
    -- Backup verification
    backup_hash VARCHAR(64) NOT NULL, -- Hash of backed up content
    backup_size_bytes BIGINT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'verified', 'failed', 'corrupted'
    )),
    
    -- Backup lifecycle
    backup_type VARCHAR(20) DEFAULT 'automatic' CHECK (backup_type IN ('automatic', 'manual', 'migration')),
    backup_retention_until DATE NOT NULL,
    
    -- Recovery information
    recovery_tested BOOLEAN DEFAULT false,
    last_recovery_test TIMESTAMP WITH TIME ZONE,
    
    -- Administrative
    backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_backup_size CHECK (backup_size_bytes > 0)
);

-- =============================================================================
-- DOCUMENT SHARING TOKENS TABLE
-- =============================================================================
-- Temporary tokens for secure document sharing
CREATE TABLE document_sharing_tokens (
    token UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationships
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Token details
    purpose VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255), -- Optional: specific recipient
    recipient_phone VARCHAR(50), -- Optional: for SMS sharing
    
    -- Access controls
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Permissions granted by this token
    allowed_actions VARCHAR(50)[] DEFAULT ARRAY['view'], -- 'view', 'download'
    
    -- Security
    requires_password BOOLEAN DEFAULT false,
    password_hash VARCHAR(255), -- For password-protected sharing
    
    -- Tracking
    first_used_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    used_by_ips INET[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'exhausted')),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by_id UUID REFERENCES user_profiles(id),
    
    -- Administrative  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_token_uses CHECK (current_uses <= max_uses),
    CONSTRAINT future_expiry CHECK (expires_at > created_at)
);

-- =============================================================================
-- TRIGGERS FOR DOCUMENT TABLES
-- =============================================================================

-- Update document vault updated_at timestamp
CREATE TRIGGER update_document_vault_updated_at 
    BEFORE UPDATE ON document_vault 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update document categories updated_at timestamp  
CREATE TRIGGER update_document_categories_updated_at 
    BEFORE UPDATE ON document_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update document sharing permissions updated_at timestamp
CREATE TRIGGER update_document_sharing_permissions_updated_at 
    BEFORE UPDATE ON document_sharing_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update document processing queue updated_at timestamp
CREATE TRIGGER update_document_processing_queue_updated_at 
    BEFORE UPDATE ON document_processing_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update document sharing tokens updated_at timestamp
CREATE TRIGGER update_document_sharing_tokens_updated_at 
    BEFORE UPDATE ON document_sharing_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DOCUMENT LIFECYCLE MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to automatically expire sharing tokens
CREATE OR REPLACE FUNCTION expire_sharing_tokens()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE document_sharing_tokens 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old document access logs
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM document_access_log 
    WHERE retention_until < CURRENT_DATE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark documents for deletion based on retention policy
CREATE OR REPLACE FUNCTION mark_documents_for_deletion()
RETURNS INTEGER AS $$
DECLARE
    marked_count INTEGER;
BEGIN
    UPDATE document_vault 
    SET deletion_warning_sent = true, updated_at = NOW()
    WHERE auto_delete_enabled = true 
    AND retention_until <= (CURRENT_DATE + INTERVAL '30 days')
    AND deletion_warning_sent = false
    AND legal_hold = false;
    
    GET DIAGNOSTICS marked_count = ROW_COUNT;
    RETURN marked_count;
END;
$$ LANGUAGE plpgsql;