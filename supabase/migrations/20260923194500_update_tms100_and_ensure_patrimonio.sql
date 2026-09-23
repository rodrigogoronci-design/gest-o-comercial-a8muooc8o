-- Migration: Atualização de catálogo - Plano TMS 100 para R$ 757,00 e garantia do módulo Patrimônio R$ 199,00
-- Totalmente aditiva: sem DELETEs, sem alteração de colunas/índices, sem impacto nos clientes existentes

-- 1. Inserir ou garantir o módulo adicional Patrimônio (R$ 199,00)
INSERT INTO public.planos_saude (
  id,
  codigo,
  descricao,
  valor_titular,
  valor_dependente,
  com_coparticipacao,
  padrao,
  tipo,
  modulos
)
VALUES (
  gen_random_uuid(),
  'MOD-PATRIMONIO',
  'Patrimônio',
  199.00,
  0,
  false,
  false,
  'modulo',
  '[]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE
SET
  descricao = EXCLUDED.descricao,
  valor_titular = EXCLUDED.valor_titular,
  tipo = EXCLUDED.tipo;

-- 2. Atualizar o valor do plano TMS 100 para R$ 757,00
UPDATE public.planos_saude
SET valor_titular = 757.00
WHERE codigo = 'ERP-TMS-100';
