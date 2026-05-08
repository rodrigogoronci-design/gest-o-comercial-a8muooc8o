ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS diagnostico JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Also ensure solicitacoes_servico has the correct RLS just in case
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.solicitacoes_servico;
CREATE POLICY "Allow all access to authenticated users" ON public.solicitacoes_servico
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
