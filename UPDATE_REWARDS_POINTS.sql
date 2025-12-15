-- ====================================================================
-- ECOLAKE REWARDS UPDATE - Lower Values & Points
-- Run this in your Supabase SQL Editor
-- ====================================================================

-- Step 1: Update gift card VALUES to below ₹100
UPDATE rewards
SET value = CASE
  WHEN value >= 1000 THEN 99    -- Big cards become ₹99
  WHEN value >= 500 THEN 75     -- ₹500 becomes ₹75
  WHEN value >= 250 THEN 50     -- ₹250 becomes ₹50
  WHEN value >= 100 THEN 25     -- ₹100 becomes ₹25
  ELSE 10                        -- Others become ₹10
END
WHERE category = 'gift_card';

-- Step 2: Update ALL rewards to have minimum 10,000 points
UPDATE rewards
SET points_required = CASE
  WHEN value >= 75 THEN 15000   -- ₹75+ = 15,000 points
  WHEN value >= 50 THEN 12000   -- ₹50 = 12,000 points
  WHEN value >= 25 THEN 10000   -- ₹25 = 10,000 points
  ELSE 10000                     -- Default = 10,000 points
END;

-- Step 3: Ensure NO reward has less than 10,000 points
UPDATE rewards
SET points_required = 10000
WHERE points_required < 10000;

-- Step 4: Verify the changes
SELECT 
  name, 
  category, 
  value as "Value (₹)", 
  points_required as "Points Required",
  stock_available
FROM rewards
ORDER BY value DESC;

-- Done! Gift cards now have values below ₹100 🎯
