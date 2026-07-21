ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planos_saude_select_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_select_authenticated" ON public.planos_saude
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "planos_saude_select_anon" ON public.planos_saude;
CREATE POLICY "planos_saude_select_anon" ON public.planos_saude
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "planos_saude_insert_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_insert_authenticated" ON public.planos_saude
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "planos_saude_update_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_update_authenticated" ON public.planos_saude
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "planos_saude_delete_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_delete_authenticated" ON public.planos_saude
  FOR DELETE TO authenticated USING (true);
