ALTER TABLE public.planos_saude ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read on planos_saude" ON public.planos_saude;
CREATE POLICY "Allow authenticated read on planos_saude" 
  ON public.planos_saude 
  FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow anon read on planos_saude" ON public.planos_saude;
CREATE POLICY "Allow anon read on planos_saude" 
  ON public.planos_saude 
  FOR SELECT 
  TO anon 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on planos_saude" ON public.planos_saude;
CREATE POLICY "Allow authenticated insert on planos_saude" 
  ON public.planos_saude 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on planos_saude" ON public.planos_saude;
CREATE POLICY "Allow authenticated update on planos_saude" 
  ON public.planos_saude 
  FOR UPDATE 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on planos_saude" ON public.planos_saude;
CREATE POLICY "Allow authenticated delete on planos_saude" 
  ON public.planos_saude 
  FOR DELETE 
  TO authenticated 
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.planos_saude LIMIT 1) THEN
    INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao) VALUES
    (gen_random_uuid(), 'TMS-BASE', 'Plano TMS Base', 199.90, 0, false, true),
    (gen_random_uuid(), 'TMS-PRO', 'Plano TMS Profissional', 299.90, 0, false, false),
    (gen_random_uuid(), 'TMS-ENT', 'Plano TMS Enterprise', 499.90, 0, false, false);
  END IF;
END $$;
