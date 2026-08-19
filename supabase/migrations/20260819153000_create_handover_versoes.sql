-- ============================================================
-- Handover Comercial → Execução — Histórico de Versões
-- Cria a tabela handover_versoes que armazena cada versão salva
-- do conteúdo do handover comercial, tanto para implementações
-- quanto para consultorias do CRM (ambas vivem em implementacoes).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.handover_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implementacao_id UUID REFERENCES public.implementacoes(id) ON DELETE CASCADE,
  consultoria_id UUID,  -- referência lógica para implementacoes.id quando
                       -- o contexto for CRM consultoria (nullable para
                       -- compatibilidade; não usamos FK dupla para evitar
                       -- ciclos, pois consultoria_id aponta para a mesma
                       -- tabela implementacoes).
  conteudo TEXT,
  responsavel_comercial TEXT,
  responsavel_execucao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por TEXT
);

-- Índices para consulta rápida de versões por implementação/consultoria
CREATE INDEX IF NOT EXISTS idx_handover_versoes_impl
  ON public.handover_versoes (implementacao_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_handover_versoes_consultoria
  ON public.handover_versoes (consultoria_id, criado_em DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.handover_versoes ENABLE ROW LEVEL SECURITY;

-- Permite que usuários autenticados realizem todas as operações
-- (mesmo modelo já adotado pela tabela implementacoes).
DROP POLICY IF EXISTS "handover_versoes_all" ON public.handover_versoes;
CREATE POLICY "handover_versoes_all" ON public.handover_versoes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
