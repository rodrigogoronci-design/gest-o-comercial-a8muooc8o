ALTER TABLE public.solicitacoes_servico ADD COLUMN IF NOT EXISTS contato_nome TEXT;
ALTER TABLE public.solicitacoes_servico ADD COLUMN IF NOT EXISTS contato_telefone TEXT;
