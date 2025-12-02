-- Fix for infinite recursion in group_members RLS policy
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view memberships in their groups" ON group_members;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view their own memberships"
    ON group_members FOR SELECT
    USING (auth.uid() = user_id);

-- This simpler policy allows:
-- - Users to see all groups they belong to
-- - No circular dependency since we only check user_id directly
