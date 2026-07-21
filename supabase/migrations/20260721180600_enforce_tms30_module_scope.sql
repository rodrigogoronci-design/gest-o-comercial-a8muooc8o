INSERT INTO public.planos_saude (codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente, tipo, modulos)
VALUES (
  'ERP-TMS-30',
  'TMS 30',
  250.00,
  0,
  false,
  false,
  NULL,
  0,
  'plano_base',
  '["Administração", "Básico", "Carga", "Comercial"]'::jsonb
)
ON CONFLICT (codigo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  valor_titular = EXCLUDED.valor_titular,
  valor_dependente = EXCLUDED.valor_dependente,
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
  valor = jsonb_build_object(
    'tms-30', '["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]'::jsonb
  ),
  updated_at = NOW();
