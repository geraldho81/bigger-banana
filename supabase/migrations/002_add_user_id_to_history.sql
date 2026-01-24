-- Add user_id for per-user history
alter table history add column if not exists user_id uuid;

create index if not exists history_user_id_idx on history(user_id);

-- Replace permissive policy with per-user access
DROP POLICY IF EXISTS "Allow all operations on history" ON history;

CREATE POLICY "Users can read their own history"
  ON history
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own history"
  ON history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own history"
  ON history
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own history"
  ON history
  FOR DELETE
  USING (user_id = auth.uid());
