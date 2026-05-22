DO $$
BEGIN
  INSERT INTO public.configuracoes (chave, valor)
  VALUES (
    'pricing_tiers',
    '{"placa_adicional_frota": [{"max": 50, "price": 10}, {"max": 100, "price": 6}, {"max": 200, "price": 3}, {"max": null, "price": 2}]}'::jsonb
  ) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
END $$;
