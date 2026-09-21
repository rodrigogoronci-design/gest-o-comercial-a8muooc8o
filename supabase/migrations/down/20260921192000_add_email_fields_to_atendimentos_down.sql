-- Migration down: remove aditivas columns and index from atendimentos_clientes
-- Para reversão limpa se necessário

DROP INDEX IF EXISTS public.idx_atendimentos_clientes_email_conversa_unique;

ALTER TABLE public.atendimentos_clientes
  DROP COLUMN IF EXISTS observacoes_revisao,
  DROP COLUMN IF EXISTS importacao_status,
  DROP COLUMN IF EXISTS anexos,
  DROP COLUMN IF EXISTS conversa_id,
  DROP COLUMN IF EXISTS uid_emails,
  DROP COLUMN IF EXISTS remetentes_destinatarios,
  DROP COLUMN IF EXISTS qtd_mensagens_enviadas,
  DROP COLUMN IF EXISTS qtd_mensagens_recebidas,
  DROP COLUMN IF EXISTS data_ultimo_movimento,
  DROP COLUMN IF EXISTS situacao,
  DROP COLUMN IF EXISTS fluxo,
  DROP COLUMN IF EXISTS area_responsavel,
  DROP COLUMN IF EXISTS tipo_atendimento,
  DROP COLUMN IF EXISTS resumo,
  DROP COLUMN IF EXISTS assunto,
  DROP COLUMN IF EXISTS contato,
  DROP COLUMN IF EXISTS cnpj,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS origem;
