ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS treinamento_hora TEXT;
ALTER TABLE public.implementacao_etapas ADD COLUMN IF NOT EXISTS hora_prevista TEXT;
ALTER TABLE public.implementacao_etapas ADD COLUMN IF NOT EXISTS hora_realizada TEXT;
