INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, com_coparticipacao, padrao, tipo)
SELECT gen_random_uuid(), 'ERP-TMS-30', 'Até 30 CTEs/mês, máximo 30 documentos', 250.00, false, false, 'plano_base'
WHERE NOT EXISTS (
  SELECT 1 FROM public.planos_saude WHERE codigo = 'ERP-TMS-30'
);
