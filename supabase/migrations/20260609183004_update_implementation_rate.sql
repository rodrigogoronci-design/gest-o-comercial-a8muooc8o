DO $$
BEGIN
  INSERT INTO public.configuracoes (chave, valor)
  VALUES (
    'precos_servicos', 
    '{"implementation_rates": {"presencial": 260.0, "remoto": 130.0}}'::jsonb
  )
  ON CONFLICT (chave) DO UPDATE 
  SET valor = jsonb_set(
    COALESCE(public.configuracoes.valor, '{}'::jsonb), 
    '{implementation_rates}', 
    '{"presencial": 260.0, "remoto": 130.0}'::jsonb
  );
END $$;
