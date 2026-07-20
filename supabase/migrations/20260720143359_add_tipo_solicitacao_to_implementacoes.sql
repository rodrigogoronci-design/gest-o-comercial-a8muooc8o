-- Add tipo column to implementacoes
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'novo_cliente';

-- Add solicitacao_id column with FK to solicitacoes_servico
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS solicitacao_id UUID REFERENCES public.solicitacoes_servico(id) ON DELETE SET NULL;

-- Add columns for module inclusion tracking
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS modulos_novos JSONB DEFAULT '[]'::jsonb;

-- Add columns for training tracking
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS treinamento_motivo TEXT;
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS treinamento_topicos TEXT;
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS treinamento_data DATE;

-- Add check constraint for tipo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'implementacoes_tipo_check') THEN
    ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_tipo_check
      CHECK (tipo IN ('novo_cliente', 'inclusao_modulo', 'treinamento'));
  END IF;
END $$;

-- Backfill existing rows with default tipo
UPDATE public.implementacoes SET tipo = 'novo_cliente' WHERE tipo IS NULL;

-- Seed implementation team members if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.colaboradores WHERE nome = 'Rayne' AND role = 'Implantação') THEN
    INSERT INTO public.colaboradores (nome, status, role, cargo, departamento, created_at)
    VALUES ('Rayne', 'Ativo', 'Implantação', 'Analista de Implantação', 'Implantação', NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.colaboradores WHERE nome = 'Mailton' AND role = 'Implantação') THEN
    INSERT INTO public.colaboradores (nome, status, role, cargo, departamento, created_at)
    VALUES ('Mailton', 'Ativo', 'Implantação', 'Analista de Implantação', 'Implantação', NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.colaboradores WHERE nome = 'Gesualdo' AND role = 'Implantação') THEN
    INSERT INTO public.colaboradores (nome, status, role, cargo, departamento, created_at)
    VALUES ('Gesualdo', 'Ativo', 'Implantação', 'Analista de Implantação', 'Implantação', NOW());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.colaboradores WHERE nome = 'Clecia' AND role = 'Implantação') THEN
    INSERT INTO public.colaboradores (nome, status, role, cargo, departamento, created_at)
    VALUES ('Clecia', 'Ativo', 'Implantação', 'Analista de Implantação', 'Implantação', NOW());
  END IF;
END $$;

-- Ensure RLS policies are still in place
ALTER TABLE public.implementacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementacao_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacoes_all" ON public.implementacoes;
CREATE POLICY "implementacoes_all" ON public.implementacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "implementacao_etapas_all" ON public.implementacao_etapas;
CREATE POLICY "implementacao_etapas_all" ON public.implementacao_etapas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
