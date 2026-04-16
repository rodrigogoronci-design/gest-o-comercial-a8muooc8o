CREATE TABLE IF NOT EXISTS public.crm_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  contato_nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Contato Inicial',
  observacoes TEXT,
  ultima_interacao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.crm_prospects;
CREATE POLICY "Allow all access to authenticated users" ON public.crm_prospects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to anon users" ON public.crm_prospects;
CREATE POLICY "Allow all access to anon users" ON public.crm_prospects
  FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.crm_prospects) THEN
    INSERT INTO public.crm_prospects (id, empresa, contato_nome, status, ultima_interacao) VALUES
    (gen_random_uuid(), 'Transportadora Alpha', 'Carlos Silva', 'Aguardando Feedback', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'Logística Beta', 'Ana Souza', 'Em Negociação', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), 'Rápido Entregas', 'Marcos Oliveira', 'Contato Inicial', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'Expresso Sul', 'Juliana Lima', 'Fechado', NOW() - INTERVAL '10 days');
  END IF;
END $$;
