-- Drop the restrictive foods_select policy
DROP POLICY IF EXISTS "foods_select" ON foods;

-- Create a new policy allowing any authenticated user to select any food
CREATE POLICY "foods_select_all"
  ON foods FOR SELECT
  USING (auth.uid() IS NOT NULL);
