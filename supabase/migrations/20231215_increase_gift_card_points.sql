-- Set minimum 10,000 points required for all rewards
-- This makes all rewards more valuable and encourages active participation

-- Update all rewards to have minimum 10,000 points
UPDATE rewards
SET points_required = CASE
  WHEN value >= 2000 THEN 25000  -- ₹2000+ = 25,000 points
  WHEN value >= 1000 THEN 20000  -- ₹1000 = 20,000 points
  WHEN value >= 500 THEN 15000   -- ₹500 = 15,000 points
  WHEN value >= 250 THEN 12000   -- ₹250 = 12,000 points
  WHEN value >= 100 THEN 10000   -- ₹100 = 10,000 points
  ELSE 10000                      -- Default minimum = 10,000 points
END;

-- Ensure no reward has less than 10,000 points
UPDATE rewards
SET points_required = 10000
WHERE points_required < 10000;

-- Add comment for tracking
COMMENT ON TABLE rewards IS 'All rewards now require minimum 10,000 points (updated 2025-12-14)';
