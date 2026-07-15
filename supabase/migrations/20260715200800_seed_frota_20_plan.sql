INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, franquia_quantidade, valor_excedente)
SELECT gen_random_uuid(), 'FROTA_20', 'Frota – Até 20 Placas', 320.00, 0, false, false, 20, 8.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.planos_saude WHERE codigo = 'FROTA_20'
);
