-- Fix groups INSERT policy to work correctly with authenticated users
-- Run this in Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Create a new policy that works with the auth system
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        owner_id = auth.uid()
    );
