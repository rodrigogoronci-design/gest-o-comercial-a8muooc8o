-- Migration: add additive columns to atendimentos_clientes for email integration
-- Non-destructive, all columns nullable, no backfill, no touch to existing records.
--
-- Requisitos atendidos:
-- 1. conversa_id determinístico e reproduzível: gerado preferencialmente a partir dos
--    Message-ID originais da conversa (ex.: hash ordenado dos Message-IDs). UID isolado NÃO serve.
-- 2. Índice único parcial: UNIQUE (conversa_id) WHERE origem = 'E-mail corporativo' AND conversa_id IS NOT NULL.
-- 3. anexos em jsonb comportam nome, tipo, tamanho e URL válida do storage:
--    [{"nome": "arquivo.pdf", "tipo": "application/pdf", "tamanho": 1024, "url": "https://..."}]
-- 4. data original do atendimento fica em data_atendimento (já existente) separada de created_at.
-- 5. Down-migration documentada abaixo.

ALTER TABLE public.atendimentos_clientes
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS assunto text,
  ADD COLUMN IF NOT EXISTS resumo text,
  ADD COLUMN IF NOT EXISTS tipo_atendimento text,
  ADD COLUMN IF NOT EXISTS area_responsavel text,
  ADD COLUMN IF NOT EXISTS fluxo text,
  ADD COLUMN IF NOT EXISTS situacao text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS data_ultimo_movimento timestamptz,
  ADD COLUMN IF NOT EXISTS qtd_mensagens_recebidas integer,
  ADD COLUMN IF NOT EXISTS qtd_mensagens_enviadas integer,
  ADD COLUMN IF NOT EXISTS remetentes_destinatarios jsonb,
  ADD COLUMN IF NOT EXISTS uid_emails jsonb,
  ADD COLUMN IF NOT EXISTS conversa_id text,
  ADD COLUMN IF NOT EXISTS anexos jsonb,
  ADD COLUMN IF NOT EXISTS importacao_status text,
  ADD COLUMN IF NOT EXISTS observacoes_revisao text;

-- Índice único parcial de deduplicação
CREATE UNIQUE INDEX IF NOT EXISTS idx_atendimentos_clientes_conversa_id_email
  ON public.atendimentos_clientes (conversa_id)
  WHERE origem = 'E-mail corporativo' AND conversa_id IS NOT NULL;

/*
-- DOWN MIGRATION (Procedimento de reversão se necessário):
-- ATENÇÃO: Válida apenas enquanto não houver dados importados ou após remoção dos registros importados.
-- Em produção com dados importados, remover as colunas causará perda irreversível dos dados novos.

DROP INDEX IF EXISTS public.idx_atendimentos_clientes_conversa_id_email;

ALTER TABLE public.atendimentos_clientes
  DROP COLUMN IF EXISTS cnpj,
  DROP COLUMN IF EXISTS contato,
  DROP COLUMN IF EXISTS assunto,
  DROP COLUMN IF EXISTS resumo,
  DROP COLUMN IF EXISTS tipo_atendimento,
  DROP COLUMN IF EXISTS area_responsavel,
  DROP COLUMN IF EXISTS fluxo,
  DROP COLUMN IF EXISTS situacao,
  DROP COLUMN IF EXISTS origem,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS data_ultimo_movimento,
  DROP COLUMN IF EXISTS qtd_mensagens_recebidas,
  DROP COLUMN IF EXISTS qtd_mensagens_enviadas,
  DROP COLUMN IF EXISTS remetentes_destinatarios,
  DROP COLUMN IF EXISTS uid_emails,
  DROP COLUMN IF EXISTS conversa_id,
  DROP COLUMN IF EXISTS anexos,
  DROP COLUMN IF EXISTS importacao_status,
  DROP COLUMN IF EXISTS observacoes_revisao;
*/
