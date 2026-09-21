-- Migration: add columns to atendimentos_clientes for email integration
-- Migration aditiva e não-destrutiva

ALTER TABLE public.atendimentos_clientes
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS assunto text,
  ADD COLUMN IF NOT EXISTS resumo text,
  ADD COLUMN IF NOT EXISTS tipo_atendimento text,
  ADD COLUMN IF NOT EXISTS area_responsavel text,
  ADD COLUMN IF NOT EXISTS fluxo text,
  ADD COLUMN IF NOT EXISTS situacao text,
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_atendimentos_clientes_email_conversa_unique
  ON public.atendimentos_clientes (conversa_id)
  WHERE origem = 'E-mail corporativo' AND conversa_id IS NOT NULL;
