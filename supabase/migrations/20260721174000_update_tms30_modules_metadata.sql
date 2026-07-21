ALTER TABLE public.planos_saude
  ADD COLUMN IF NOT EXISTS modulos jsonb DEFAULT '[]'::jsonb;

UPDATE public.planos_saude
SET modulos = '["Administração", "Básico", "Carga", "Comercial"]'::jsonb,
    descricao = 'Até 30 CTEs/mês, máximo 30 documentos',
    valor_titular = 250.00,
    com_coparticipacao = false,
    padrao = false,
    tipo = 'plano_base'
WHERE codigo = 'ERP-TMS-30';

INSERT INTO public.configuracoes (chave, valor, updated_at)
VALUES (
  'plan_module_map',
  '{"tms-30": ["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]}'::jsonb,
  NOW()
)
ON CONFLICT (chave) DO UPDATE
SET valor = '{"tms-30": ["mod-admin", "mod-basico", "mod-carga", "mod-comercial"]}'::jsonb,
    updated_at = NOW();
