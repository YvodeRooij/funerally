-- Create family intakes table for auto-save functionality
CREATE TABLE IF NOT EXISTS family_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat history table
CREATE TABLE IF NOT EXISTS intake_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES family_intakes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('user', 'assistant', 'suggestion')),
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create generated reports table
CREATE TABLE IF NOT EXISTS intake_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intake_id UUID REFERENCES family_intakes(id) ON DELETE CASCADE,
  report_data TEXT NOT NULL, -- Encrypted JSON data
  report_summary JSONB, -- Unencrypted summary for searching
  status VARCHAR(50) DEFAULT 'pending_match',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report access control table
CREATE TABLE IF NOT EXISTS report_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES intake_reports(id) ON DELETE CASCADE,
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  UNIQUE(report_id, director_id)
);

-- Create indexes for performance
CREATE INDEX idx_family_intakes_user_id ON family_intakes(user_id);
CREATE INDEX idx_family_intakes_completed ON family_intakes(completed);
CREATE INDEX idx_intake_chat_history_intake_id ON intake_chat_history(intake_id);
CREATE INDEX idx_intake_reports_family_id ON intake_reports(family_id);
CREATE INDEX idx_intake_reports_status ON intake_reports(status);
CREATE INDEX idx_report_access_director_id ON report_access(director_id);
CREATE INDEX idx_report_access_expires_at ON report_access(expires_at);

-- Enable Row Level Security
ALTER TABLE family_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_intakes
CREATE POLICY "Users can view own intakes" ON family_intakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intakes" ON family_intakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intakes" ON family_intakes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for intake_chat_history
CREATE POLICY "Users can view own chat history" ON intake_chat_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_intakes 
      WHERE family_intakes.id = intake_chat_history.intake_id 
      AND family_intakes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages" ON intake_chat_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_intakes 
      WHERE family_intakes.id = intake_chat_history.intake_id 
      AND family_intakes.user_id = auth.uid()
    )
  );

-- RLS Policies for intake_reports
CREATE POLICY "Users can view own reports" ON intake_reports
  FOR SELECT USING (auth.uid() = family_id);

CREATE POLICY "Directors can view shared reports" ON intake_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM report_access
      WHERE report_access.report_id = intake_reports.id
      AND report_access.director_id = auth.uid()
      AND report_access.expires_at > now()
    )
  );

CREATE POLICY "System can insert reports" ON intake_reports
  FOR INSERT WITH CHECK (auth.uid() = family_id);

-- RLS Policies for report_access
CREATE POLICY "Directors can view own access" ON report_access
  FOR SELECT USING (auth.uid() = director_id);

CREATE POLICY "System can manage access" ON report_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM intake_reports
      WHERE intake_reports.id = report_access.report_id
      AND intake_reports.family_id = auth.uid()
    )
  );

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_family_intakes_updated_at BEFORE UPDATE ON family_intakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_reports_updated_at BEFORE UPDATE ON intake_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();