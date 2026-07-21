INSERT INTO public.planos_saude (codigo, descricao, valor_titular, com_coparticipacao, padrao, tipo, modulos)
VALUES (
  'ERP-TMS-30',
  'TMS 30',
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

UPDATE public.configuracoes
SET valor = '{"tms-30": ["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]}'::jsonb,
    updated_at = NOW()
WHERE chave = 'plan_module_map';
