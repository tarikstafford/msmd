-- Comprehensive RLS policy fixes
-- Run this entire file in Supabase SQL Editor

-- =====================================================
-- PROFILES TABLE - Fix upsert support
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate with proper permissions
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- GROUPS TABLE
-- =====================================================

-- Already fixed in previous migration, but ensuring it's correct
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- Verify all policies are working
-- =====================================================

-- You should see output confirming the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'groups', 'group_members', 'players', 'entries')
ORDER BY tablename, policyname;
