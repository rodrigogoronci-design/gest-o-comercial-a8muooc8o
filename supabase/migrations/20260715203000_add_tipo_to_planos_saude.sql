ALTER TABLE public.planos_saude ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'plano_base';

UPDATE public.planos_saude SET tipo = 'modulo' WHERE codigo = 'FROTA_20';
UPDATE public.planos_saude SET tipo = 'modulo' WHERE codigo LIKE 'MOD-%';
UPDATE public.planos_saude SET tipo = 'plano_base' WHERE codigo LIKE 'ERP-%';

DROP POLICY IF EXISTS "planos_saude_select_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_select_authenticated" ON public.planos_saude
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "planos_saude_insert_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_insert_authenticated" ON public.planos_saude
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "planos_saude_update_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_update_authenticated" ON public.planos_saude
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "planos_saude_delete_authenticated" ON public.planos_saude;
CREATE POLICY "planos_saude_delete_authenticated" ON public.planos_saude
  FOR DELETE TO authenticated USING (true);
