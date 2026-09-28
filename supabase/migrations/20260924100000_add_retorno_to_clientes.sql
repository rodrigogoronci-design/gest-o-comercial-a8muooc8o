-- Migration aditiva para suporte à reativação de clientes
-- Adiciona colunas para registrar a data do retorno e eventuais observações
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS data_retorno DATE,
  ADD COLUMN IF NOT EXISTS observacao_retorno TEXT;
