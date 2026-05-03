-- AI Waste Detection & Auto-Assignment Pipeline
-- Adds AI analysis columns to reports and auto-assigns volunteers based on city/availability

-- Add AI analysis columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(50) DEFAULT 'pending' CHECK (ai_analysis_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_waste_type VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_severity_level INT CHECK (ai_severity_level >= 1 AND ai_severity_level <= 5);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_estimated_cleanup_time_minutes INT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_recommended_tools TEXT[] DEFAULT '{}';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_raw_response JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_error TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add volunteer management columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_capacity INT DEFAULT 5 CHECK (volunteer_capacity >= 0);

-- Create index for city-based volunteer lookups
CREATE INDEX IF NOT EXISTS idx_users_city_role_active ON users(city, role, is_active) WHERE role = 'cleaner' AND is_active = true;

-- Create index for report status and AI analysis status
CREATE INDEX IF NOT EXISTS idx_reports_status_ai_status ON reports(status, ai_analysis_status);

-- Function to auto-assign volunteers to verified reports
CREATE OR REPLACE FUNCTION public.auto_assign_volunteer(p_report_id uuid)
RETURNS void AS $$
DECLARE
  v_report_city VARCHAR(100);
  v_cleaner_id uuid;
  v_assigned_count INT;
BEGIN
  -- Get the report's city
  SELECT city INTO v_report_city FROM reports WHERE id = p_report_id;
  
  IF v_report_city IS NULL THEN
    RETURN;
  END IF;
  
  -- Find an available volunteer in the same city with lowest assigned tasks
  SELECT u.id INTO v_cleaner_id
  FROM users u
  WHERE u.city = v_report_city
    AND u.role = 'cleaner'
    AND u.is_active = true
    AND (u.volunteer_capacity IS NULL OR u.volunteer_capacity > 0)
  LEFT JOIN reports r ON u.id = r.assigned_cleaner_id AND r.status IN ('assigned', 'in_progress')
  GROUP BY u.id
  ORDER BY COUNT(r.id) ASC, u.id
  LIMIT 1;
  
  -- If volunteer found, assign the report
  IF v_cleaner_id IS NOT NULL THEN
    UPDATE reports
    SET assigned_cleaner_id = v_cleaner_id,
        status = 'assigned',
        assigned_at = NOW()
    WHERE id = p_report_id;
    
    -- Create notification for the volunteer
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_cleaner_id,
      'report_assigned',
      '🧹 New Cleanup Task',
      'A new cleanup task has been assigned to you',
      jsonb_build_object(
        'report_id', p_report_id,
        'action', 'view_report'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign when report is verified and AI analysis is complete
CREATE OR REPLACE FUNCTION public.trigger_auto_assign()
RETURNS TRIGGER AS $$
BEGIN
  -- If report status changed to verified and AI analysis is complete and not yet assigned
  IF NEW.status = 'verified' 
     AND NEW.ai_analysis_status = 'completed'
     AND NEW.assigned_cleaner_id IS NULL
     AND (OLD.status != 'verified' OR OLD.ai_analysis_status != 'completed') THEN
    PERFORM public.auto_assign_volunteer(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF NOT EXISTS trg_auto_assign_after_verify ON reports;

-- Create trigger
CREATE TRIGGER trg_auto_assign_after_verify
AFTER UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION trigger_auto_assign();

-- Grant execute permission on auto-assign function to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_assign_volunteer(uuid) TO authenticated;
