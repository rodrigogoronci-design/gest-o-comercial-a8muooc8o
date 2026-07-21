INSERT INTO public.planos_saude (codigo, descricao, valor_titular, com_coparticipacao, padrao, tipo, modulos)
VALUES (
  'ERP-TMS-30',
  'Até 30 CTEs/mês, máximo 30 documentos',
  250.00,
  false,
  false,
  'plano_base',
  '["Administração", "Básico", "Carga", "Comercial"]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  valor_titular = EXCLUDED.valor_titular,
  com_coparticipacao = EXCLUDED.com_coparticipacao,
  padrao = EXCLUDED.padrao,
  tipo = EXCLUDED.tipo,
  modulos = EXCLUDED.modulos;

INSERT INTO public.configuracoes (chave, valor, updated_at)
VALUES (
  'plan_module_map',
  '{"tms-30": ["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]}'::jsonb,
  NOW()
)
ON CONFLICT (chave) DO UPDATE SET
  valor = public.configuracoes.valor || '{"tms-30": ["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]}'::jsonb,
  updated_at = NOW();
