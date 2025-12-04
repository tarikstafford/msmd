-- Add user_id column to players table to associate players with users
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_group_user ON players(group_id, user_id);

-- Update RLS policy to allow users to create their own player records
DROP POLICY IF EXISTS "enable_all_for_group_members" ON players;

CREATE POLICY "enable_select_for_group_members"
ON players FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "enable_insert_for_group_members"
ON players FOR INSERT
TO authenticated
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

CREATE POLICY "enable_update_own_player"
ON players FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "enable_delete_own_player"
ON players FOR DELETE
TO authenticated
USING (user_id = auth.uid());
