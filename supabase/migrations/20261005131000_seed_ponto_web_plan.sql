INSERT INTO public.planos_saude (codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente, tipo, modulos)
VALUES (
  'ERP-PONTO-WEB',
  'Ponto Web',
  0.00,
  0,
  false,
  false,
  NULL,
  0,
  'plano_base',
  '["Administração", "Básico", "Carga", "Comercial", "Faturamento", "Financeiro"]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  valor_titular = EXCLUDED.valor_titular,
  valor_dependente = EXCLUDED.valor_dependente,
  com_coparticipacao = EXCLUDED.com_coparticipacao,
  padrao = EXCLUDED.padrao,
  tipo = EXCLUDED.tipo,
  modulos = EXCLUDED.modulos;
