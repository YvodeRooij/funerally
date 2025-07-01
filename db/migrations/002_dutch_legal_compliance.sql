-- Dutch Legal Compliance Migration
-- Creates tables for Netherlands-specific funeral law compliance tracking

-- Dutch compliance tracking table
CREATE TABLE IF NOT EXISTS dutch_compliance_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    death_registration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    legal_deadline DATE NOT NULL,
    working_days_remaining INTEGER NOT NULL,
    municipality_code VARCHAR(10),
    municipality_name VARCHAR(100),
    bsn_verified BOOLEAN DEFAULT false,
    emergency_protocol_active BOOLEAN DEFAULT false,
    emergency_triggered_at TIMESTAMP WITH TIME ZONE,
    compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (
        compliance_status IN ('pending', 'in_progress', 'compliant', 'at_risk', 'emergency')
    ),
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline events tracking
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN ('registration', 'deadline_warning', 'document_generated', 'emergency_triggered', 'compliance_check', 'municipal_sync')
    ),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Municipal integration tracking
CREATE TABLE IF NOT EXISTS municipal_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    municipality_name VARCHAR(100) NOT NULL,
    municipality_code VARCHAR(10),
    api_endpoint VARCHAR(255),
    integration_status VARCHAR(50) DEFAULT 'not_started' CHECK (
        integration_status IN ('not_started', 'connecting', 'connected', 'error', 'completed')
    ),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_errors JSONB DEFAULT '[]',
    permits_issued JSONB DEFAULT '[]',
    brp_registration_ref VARCHAR(100), -- Basisregistratie Personen reference
    burial_permit_ref VARCHAR(100),
    cremation_permit_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dutch document requirements tracking
CREATE TABLE IF NOT EXISTS dutch_document_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('a_certificate', 'b_certificate', 'overlijdensakte', 'burial_permit', 'cremation_permit', 'bsn_verification')
    ),
    is_required BOOLEAN NOT NULL DEFAULT true,
    is_generated BOOLEAN DEFAULT false,
    generated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    document_id UUID REFERENCES document_vault(id),
    municipal_ref VARCHAR(100), -- Municipal system reference
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (
        verification_status IN ('pending', 'verified', 'rejected', 'expired')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dutch working days calendar (holidays, etc.)
CREATE TABLE IF NOT EXISTS dutch_working_days_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    holiday_name VARCHAR(100),
    holiday_type VARCHAR(50) CHECK (
        holiday_type IN ('national', 'regional', 'municipal', 'religious')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance alerts and notifications
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funeral_request_id UUID NOT NULL REFERENCES funeral_requests(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (
        alert_type IN ('info', 'warning', 'critical', 'emergency')
    ),
    hours_remaining INTEGER,
    message TEXT NOT NULL,
    action_required JSONB DEFAULT '[]',
    stakeholders JSONB DEFAULT '[]',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dutch_compliance_funeral_request 
    ON dutch_compliance_tracking(funeral_request_id);

CREATE INDEX IF NOT EXISTS idx_dutch_compliance_status 
    ON dutch_compliance_tracking(compliance_status);

CREATE INDEX IF NOT EXISTS idx_dutch_compliance_deadline 
    ON dutch_compliance_tracking(legal_deadline);

CREATE INDEX IF NOT EXISTS idx_timeline_events_funeral_request 
    ON timeline_events(funeral_request_id);

CREATE INDEX IF NOT EXISTS idx_timeline_events_type 
    ON timeline_events(event_type);

CREATE INDEX IF NOT EXISTS idx_timeline_events_timestamp 
    ON timeline_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_municipal_integrations_funeral_request 
    ON municipal_integrations(funeral_request_id);

CREATE INDEX IF NOT EXISTS idx_dutch_documents_funeral_request 
    ON dutch_document_requirements(funeral_request_id);

CREATE INDEX IF NOT EXISTS idx_dutch_documents_type 
    ON dutch_document_requirements(document_type);

CREATE INDEX IF NOT EXISTS idx_working_days_date 
    ON dutch_working_days_calendar(date);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_funeral_request 
    ON compliance_alerts(funeral_request_id);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_type 
    ON compliance_alerts(alert_type);

-- Add updated_at trigger for dutch_compliance_tracking
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dutch_compliance_tracking_updated_at 
    BEFORE UPDATE ON dutch_compliance_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_municipal_integrations_updated_at 
    BEFORE UPDATE ON municipal_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dutch_document_requirements_updated_at 
    BEFORE UPDATE ON dutch_document_requirements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Dutch holidays for 2024-2025
INSERT INTO dutch_working_days_calendar (date, is_working_day, holiday_name, holiday_type) 
VALUES 
    -- 2024 holidays
    ('2024-01-01', false, 'Nieuwjaarsdag', 'national'),
    ('2024-03-29', false, 'Goede Vrijdag', 'national'),
    ('2024-03-31', false, 'Eerste Paasdag', 'national'),
    ('2024-04-01', false, 'Tweede Paasdag', 'national'),
    ('2024-04-27', false, 'Koningsdag', 'national'),
    ('2024-05-05', false, 'Bevrijdingsdag', 'national'),
    ('2024-05-09', false, 'Hemelvaartsdag', 'national'),
    ('2024-05-19', false, 'Eerste Pinksterdag', 'national'),
    ('2024-05-20', false, 'Tweede Pinksterdag', 'national'),
    ('2024-12-25', false, 'Eerste Kerstdag', 'national'),
    ('2024-12-26', false, 'Tweede Kerstdag', 'national'),
    
    -- 2025 holidays
    ('2025-01-01', false, 'Nieuwjaarsdag', 'national'),
    ('2025-04-18', false, 'Goede Vrijdag', 'national'),
    ('2025-04-20', false, 'Eerste Paasdag', 'national'),
    ('2025-04-21', false, 'Tweede Paasdag', 'national'),
    ('2025-04-27', false, 'Koningsdag', 'national'),
    ('2025-05-05', false, 'Bevrijdingsdag', 'national'),
    ('2025-05-29', false, 'Hemelvaartsdag', 'national'),
    ('2025-06-08', false, 'Eerste Pinksterdag', 'national'),
    ('2025-06-09', false, 'Tweede Pinksterdag', 'national'),
    ('2025-12-25', false, 'Eerste Kerstdag', 'national'),
    ('2025-12-26', false, 'Tweede Kerstdag', 'national')
ON CONFLICT (date) DO NOTHING;

-- Add RLS policies for security
ALTER TABLE dutch_compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dutch_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for dutch_compliance_tracking
CREATE POLICY "Users can view own compliance tracking" 
    ON dutch_compliance_tracking FOR SELECT 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE user_id = auth.uid() 
               OR director_id = auth.uid()
               OR venue_id = auth.uid()
        )
    );

CREATE POLICY "Directors can update compliance tracking" 
    ON dutch_compliance_tracking FOR UPDATE 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE director_id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view own timeline events" 
    ON timeline_events FOR SELECT 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE user_id = auth.uid() 
               OR director_id = auth.uid()
               OR venue_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own municipal integrations" 
    ON municipal_integrations FOR SELECT 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE user_id = auth.uid() 
               OR director_id = auth.uid()
               OR venue_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own document requirements" 
    ON dutch_document_requirements FOR SELECT 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE user_id = auth.uid() 
               OR director_id = auth.uid()
               OR venue_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own compliance alerts" 
    ON compliance_alerts FOR SELECT 
    USING (
        funeral_request_id IN (
            SELECT id FROM funeral_requests 
            WHERE user_id = auth.uid() 
               OR director_id = auth.uid()
               OR venue_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON dutch_compliance_tracking TO authenticated;
GRANT SELECT, INSERT ON timeline_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON municipal_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dutch_document_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON compliance_alerts TO authenticated;
GRANT SELECT ON dutch_working_days_calendar TO authenticated;

-- Comments for documentation
COMMENT ON TABLE dutch_compliance_tracking IS 'Tracks Netherlands-specific funeral law compliance including 6-day deadline enforcement';
COMMENT ON TABLE timeline_events IS 'Logs important events in the funeral planning timeline for compliance auditing';
COMMENT ON TABLE municipal_integrations IS 'Tracks integration status with Dutch municipal systems for permits and registrations';
COMMENT ON TABLE dutch_document_requirements IS 'Manages required Dutch legal documents (A/B certificates, burial permits, etc.)';
COMMENT ON TABLE dutch_working_days_calendar IS 'Dutch national holidays and working days calendar for deadline calculations';
COMMENT ON TABLE compliance_alerts IS 'Stores compliance-related alerts and notifications for stakeholders';