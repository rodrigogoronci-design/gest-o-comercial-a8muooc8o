INSERT INTO public.configuracoes (chave, valor, updated_at)
VALUES ('whatsapp_coordenador', '"5511999999999"', NOW())
ON CONFLICT (chave) DO NOTHING;
