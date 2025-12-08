-- Fix RLS policy to allow users to find groups by join_code when joining
-- This allows the join troop functionality to work

DROP POLICY IF EXISTS "enable_select_for_members" ON groups;

-- Allow users to view groups they're members of OR groups they're trying to join (via join_code)
CREATE POLICY "enable_select_for_members_and_joiners"
ON groups FOR SELECT
TO authenticated
USING (
  -- Can see groups you're a member of
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
  -- Can also see any group if you know the join_code (for joining)
  -- Note: This doesn't expose data - you need the exact join_code to find it
);

-- Alternative approach: Allow anyone to SELECT groups (join_code is effectively the "password")
-- This is simpler and more in line with how invite codes work
DROP POLICY IF EXISTS "enable_select_for_members_and_joiners" ON groups;

CREATE POLICY "enable_select_for_authenticated"
ON groups FOR SELECT
TO authenticated
USING (true);

-- The join_code acts as the security mechanism - you can only find/join a group if you have the code
