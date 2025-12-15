-- ============================================
-- EcoLake Supabase Setup SQL
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Enable Row Level Security on all tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any)
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

DROP POLICY IF EXISTS "Anyone can read lakes" ON lakes;
DROP POLICY IF EXISTS "NGO admins can manage lakes" ON lakes;

DROP POLICY IF EXISTS "Users can read all reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;

-- 3. Users table policies
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can read all profiles (for leaderboard, etc.)
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Lakes table policies
-- ============================================

-- Anyone can read lakes
CREATE POLICY "Anyone can read lakes"
  ON lakes FOR SELECT
  USING (true);

-- NGO admins can insert/update/delete lakes
CREATE POLICY "NGO admins can manage lakes"
  ON lakes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ngo_admin'
    )
  );

-- 5. Reports table policies
-- ============================================

-- Anyone can read all reports
CREATE POLICY "Users can read all reports"
  ON reports FOR SELECT
  USING (true);

-- Authenticated users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

-- NGO admins can update any report
CREATE POLICY "NGO admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ngo_admin'
    )
  );

-- 6. Create function to handle new user signup (RECOMMENDED)
-- ============================================
-- This automatically creates a user profile when someone signs up
-- This is more secure than allowing clients to insert directly

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'reporter')::text,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to automatically create profile on signup
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- Setup Complete!
-- ============================================
-- Your database should now be ready for user signups.
-- Test by creating a new account in your app.
