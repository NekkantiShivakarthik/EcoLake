-- Add volunteer workflow columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS volunteer_proof_photos TEXT[],
ADD COLUMN IF NOT EXISTS volunteer_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS volunteer_notes TEXT;

-- Add points field to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_assigned_cleaner ON reports(assigned_cleaner_id) WHERE assigned_cleaner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Update RLS policies to allow volunteers to update their assigned reports
CREATE POLICY "Volunteers can update their assigned reports" ON reports
  FOR UPDATE
  USING (assigned_cleaner_id = auth.uid())
  WITH CHECK (assigned_cleaner_id = auth.uid());

-- Create function to award points when volunteer completes work
CREATE OR REPLACE FUNCTION award_volunteer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points when status changes to 'cleaned' and proof photos are provided
  IF NEW.status = 'cleaned' AND OLD.status != 'cleaned' 
     AND NEW.volunteer_proof_photos IS NOT NULL 
     AND array_length(NEW.volunteer_proof_photos, 1) > 0 THEN
    
    -- Award points based on severity (1-5 severity = 10-50 points)
    UPDATE users 
    SET points = points + (COALESCE(NEW.severity, 1) * 10)
    WHERE id = NEW.assigned_cleaner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for awarding points
DROP TRIGGER IF EXISTS trigger_award_volunteer_points ON reports;
CREATE TRIGGER trigger_award_volunteer_points
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION award_volunteer_points();

-- Grant necessary permissions
GRANT UPDATE ON reports TO authenticated;
GRANT UPDATE ON users TO authenticated;
