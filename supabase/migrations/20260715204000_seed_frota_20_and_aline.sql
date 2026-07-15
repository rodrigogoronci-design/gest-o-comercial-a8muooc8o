DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Ensure plan exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'planos_saude_codigo_key'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM (
        SELECT codigo
        FROM public.planos_saude
        WHERE codigo IS NOT NULL AND codigo != ''
        GROUP BY codigo
        HAVING COUNT(*) > 1
      ) dupes
    ) THEN
      ALTER TABLE public.planos_saude ADD CONSTRAINT planos_saude_codigo_key UNIQUE (codigo);
    END IF;
  END IF;

  INSERT INTO public.planos_saude (id, codigo, descricao, valor_titular, com_coparticipacao, padrao, franquia_quantidade, valor_excedente)
  VALUES (gen_random_uuid(), 'FROTA_20', 'Frota – Até 20 Placas', 320.00, false, false, 20, 8.00)
  ON CONFLICT (codigo) DO UPDATE SET
    descricao = EXCLUDED.descricao,
    valor_titular = EXCLUDED.valor_titular,
    franquia_quantidade = EXCLUDED.franquia_quantidade,
    valor_excedente = EXCLUDED.valor_excedente;

  -- Seed user Aline
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alinecosta@servicelogic.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'alinecosta@servicelogic.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Aline Costa"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, role, recebe_transporte)
    VALUES (new_user_id, new_user_id, 'alinecosta@servicelogic.com.br', 'Aline Costa', 'Admin', true)
    ON CONFLICT (id) DO NOTHING;
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
    WHERE email = 'alinecosta@servicelogic.com.br';
  END IF;
END $$;
