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

ALTER TABLE public.atividades_comerciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atividades_comerciais_select" ON public.atividades_comerciais FOR SELECT TO authenticated USING (true);
CREATE POLICY "atividades_comerciais_insert" ON public.atividades_comerciais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "atividades_comerciais_update" ON public.atividades_comerciais FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "atividades_comerciais_delete" ON public.atividades_comerciais FOR DELETE TO authenticated USING (true);

CREATE POLICY "atividades_comerciais_select_anon" ON public.atividades_comerciais FOR SELECT TO anon USING (true);
CREATE POLICY "atividades_comerciais_insert_anon" ON public.atividades_comerciais FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "atividades_comerciais_update_anon" ON public.atividades_comerciais FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "atividades_comerciais_delete_anon" ON public.atividades_comerciais FOR DELETE TO anon USING (true);
