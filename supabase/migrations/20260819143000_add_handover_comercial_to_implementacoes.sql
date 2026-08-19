-- ============================================================
-- Handover Comercial → Execução
-- Adiciona campos de handover comercial na tabela implementacoes
-- (usada também para projetos de consultoria, tipo='consultoria')
-- ============================================================

ALTER TABLE public.implementacoes
  ADD COLUMN IF NOT EXISTS handover_comercial TEXT DEFAULT NULL;

ALTER TABLE public.implementacoes
  ADD COLUMN IF NOT EXISTS handover_atualizado_em TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.implementacoes
  ADD COLUMN IF NOT EXISTS handover_atualizado_por TEXT DEFAULT NULL;

-- Indice para consultas futuras (opcional, idempotente)
CREATE INDEX IF NOT EXISTS idx_implementacoes_handover_atualizado_em
  ON public.implementacoes (handover_atualizado_em DESC);

-- RLS: a tabela implementacoes já possui policy "implementacoes_all" (ALL)
-- para authenticated, que cobre SELECT/INSERT/UPDATE/DELETE.
-- Nenhuma alteração de policy é necessária.
