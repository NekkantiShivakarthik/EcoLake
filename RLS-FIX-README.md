# Fixing Row Level Security (RLS) Policy Violation on Signup

## Problem
When users try to sign up, they get an RLS policy violation error because the app tries to insert into the `users` table, but the RLS policies block this operation.

## Solution Implemented

I've made changes to your code that work with two possible database configurations:

### Changes Made to Code:
1. **Updated `auth-context.tsx`**:
   - Modified signup to pass user metadata (name, role) to Supabase
   - Added fallback logic to create profiles on first login if they don't exist
   - Added better error handling for profile creation

### Database Setup Required:

You need to run the SQL commands in `supabase-setup.sql` in your Supabase project.

#### How to Run the SQL:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** from the left sidebar
4. Copy the contents of `supabase-setup.sql` and paste it
5. Click **Run** or press `Ctrl+Enter`

## What the SQL Does:

1. **Enables RLS** on all tables (users, lakes, reports)
2. **Creates policies** that allow:
   - Users to read their own profile and all other profiles
   - Users to update their own profile
   - Users to insert their own profile during signup
   - Everyone to read lakes
   - NGO admins to manage lakes
   - Users to create and manage their own reports
   - NGO admins to manage all reports

3. **Creates a database trigger** (RECOMMENDED):
   - Automatically creates a user profile when someone signs up
   - Runs server-side with elevated privileges
   - More secure than client-side insertion

## Testing:

After running the SQL:
1. Clear your app's cache or reinstall
2. Try signing up with a new email
3. You should no longer see RLS policy violations

## Troubleshooting:

If you still see errors:
1. Check that all SQL commands ran successfully
2. Verify RLS is enabled: Check in Supabase Dashboard > Database > Tables
3. Check the error message in your app for specific policy names
4. Make sure you're using the latest code from `auth-context.tsx`

## Alternative (Quick Fix):

If you can't run the SQL right now, you can temporarily disable RLS on the users table (NOT RECOMMENDED for production):

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

But this should only be used for testing!
