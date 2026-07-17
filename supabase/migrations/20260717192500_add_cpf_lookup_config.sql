INSERT INTO public.configuracoes (chave, valor, updated_at)
VALUES ('cpf_lookup_enabled', 'true'::jsonb, NOW())
ON CONFLICT (chave) DO UPDATE SET valor = 'true'::jsonb, updated_at = NOW();
