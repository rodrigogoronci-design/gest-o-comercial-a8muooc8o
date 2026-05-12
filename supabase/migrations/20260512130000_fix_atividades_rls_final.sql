DO $$
DECLARE
  pol record;
BEGIN
  -- Drop ALL existing policies on atividades_comerciais to avoid conflicts
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'atividades_comerciais' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.atividades_comerciais', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.atividades_comerciais ENABLE ROW LEVEL SECURITY;

-- Create single unified policy for all operations
CREATE POLICY "atividades_comerciais_all" ON public.atividades_comerciais
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
