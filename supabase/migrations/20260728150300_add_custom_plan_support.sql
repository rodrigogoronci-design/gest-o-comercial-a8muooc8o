-- Migration: Add custom plan support
-- No schema changes needed - existing JSONB fields (crm_propostas.itens, clientes.modulos) are sufficient
-- This migration documents the custom plan feature

-- Custom plans are stored with:
-- crm_propostas.itens: [{ id: 'custom', type: 'custom-plan', name: '...', price: X, modules: ['mod-admin', ...] }]
-- clientes.modulos: { plano_base: 'custom name', is_custom_plan: true, modulos_inclusos: ['mod-admin', ...] }
-- clientes.plano_id: NULL (no standard plan linked)
-- clientes.valor_mensalidade: custom price

COMMENT ON TABLE public.crm_propostas IS 'Propostas comerciais - suporta planos personalizados via itens JSONB com type=custom-plan';
COMMENT ON TABLE public.clientes IS 'Clientes - suporta planos personalizados: plano_id=NULL, modulos.is_custom_plan=true, valor_mensalidade=preço customizado';
