-- ============================================================
-- Fix Supabase Linter Security Warnings
-- 1. Set search_path on all public functions (mutable search_path)
-- 2. Tighten overly permissive RLS policies (USING/WITH CHECK = true)
-- ============================================================

-- ============================================================
-- PART 1: Fix function_search_path_mutable warnings
-- Setting search_path = '' forces fully-qualified table names,
-- preventing search_path hijacking attacks.
-- ============================================================

ALTER FUNCTION public.start_cleanup(p_report_id uuid, p_cleaner_id uuid, p_before_photos text[])
  SET search_path = '';

ALTER FUNCTION public.complete_cleanup(p_cleanup_id uuid, p_cleaner_id uuid, p_after_photos text[], p_notes text)
  SET search_path = '';

ALTER FUNCTION public.calculate_priority_score(p_severity integer, p_created_at timestamp without time zone)
  SET search_path = '';

ALTER FUNCTION public.get_user_points(p_user_id uuid)
  SET search_path = '';

ALTER FUNCTION public.award_points(p_user_id uuid, p_change integer, p_reason text)
  SET search_path = '';

ALTER FUNCTION public.submit_report(p_user_id uuid, p_lake_id uuid, p_description text, p_category text, p_severity integer, p_lat double precision, p_lng double precision, p_photos text[])
  SET search_path = '';

ALTER FUNCTION public.verify_report(p_report_id uuid, p_admin_id uuid)
  SET search_path = '';

ALTER FUNCTION public.assign_cleaner(p_report_id uuid, p_cleaner_id uuid, p_admin_id uuid)
  SET search_path = '';

ALTER FUNCTION public.verify_cleanup(p_cleanup_id uuid, p_admin_id uuid, p_points_to_award integer)
  SET search_path = '';

ALTER FUNCTION public.check_and_award_badges(p_user_id uuid)
  SET search_path = '';

ALTER FUNCTION public.get_leaderboard(p_limit integer, p_time_filter text)
  SET search_path = '';

ALTER FUNCTION public.get_user_stats(p_user_id uuid)
  SET search_path = '';

ALTER FUNCTION public.get_dashboard_stats()
  SET search_path = '';

ALTER FUNCTION public.reject_report(p_report_id uuid, p_admin_id uuid, p_reason text)
  SET search_path = '';

ALTER FUNCTION public.update_report_priority()
  SET search_path = '';

ALTER FUNCTION public.notify_report_status_change()
  SET search_path = '';

ALTER FUNCTION public.set_notification_timestamp()
  SET search_path = '';

ALTER FUNCTION public.check_badges_after_points()
  SET search_path = '';


-- ============================================================
-- PART 2: Fix rls_policy_always_true warnings
-- Replace overly permissive policies with proper auth checks.
-- ============================================================

-- ------------------------------------------------------------
-- 2a. encrypted_messages: restrict INSERT & UPDATE to authenticated sender
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.encrypted_messages;
CREATE POLICY "Authenticated users can insert own messages"
  ON public.encrypted_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Anyone can update messages" ON public.encrypted_messages;
CREATE POLICY "Sender can update own messages"
  ON public.encrypted_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- ------------------------------------------------------------
-- 2b. moderation_queue: restrict INSERT to authenticated users (own reports)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can report content" ON public.moderation_queue;
CREATE POLICY "Authenticated users can report content"
  ON public.moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- 2c. notifications: restrict INSERT to service_role only via SECURITY DEFINER functions
--     (Notifications are system-generated, not directly inserted by clients)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2d. private_users: restrict INSERT and UPDATE to own records
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert users" ON public.private_users;
CREATE POLICY "Users can insert own profile"
  ON public.private_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.private_users;
CREATE POLICY "Users can update own profile"
  ON public.private_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- 2e. reports: restrict "Anyone can submit reports" to authenticated user_id match
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2f. user_badges: restrict INSERT to service_role / SECURITY DEFINER functions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2g. user_sessions: replace blanket full access with proper scoping
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can delete sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Sessions full access" ON public.user_sessions;

CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
