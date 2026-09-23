-- Adicionar módulo adicional Patrimônio na tabela public.planos_saude
DO $$
BEGIN
  INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, valor_dependente, com_coparticipacao, padrao, tipo, modulos)
  VALUES (
    gen_random_uuid(),
    'MOD-PATRIMONIO',
    'Patrimônio',
    199,
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
END $$;
