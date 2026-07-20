DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.colaboradores
  WHERE email = 'alinecosta@servicelogic.com.br'
  LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rayne@servicelogic.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'rayne@servicelogic.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Rayne"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, departamento, role, status, recebe_transporte, organization_id)
    VALUES (v_user_id, v_user_id, 'rayne@servicelogic.com.br', 'Rayne', 'Implantação', 'colaborador', 'Ativo', false, v_org_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mailton@servicelogic.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'mailton@servicelogic.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Mailton"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, departamento, role, status, recebe_transporte, organization_id)
    VALUES (v_user_id, v_user_id, 'mailton@servicelogic.com.br', 'Mailton', 'Implantação', 'colaborador', 'Ativo', false, v_org_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gesualdo@servicelogic.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'gesualdo@servicelogic.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Gesualdo"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, departamento, role, status, recebe_transporte, organization_id)
    VALUES (v_user_id, v_user_id, 'gesualdo@servicelogic.com.br', 'Gesualdo', 'Implantação', 'colaborador', 'Ativo', false, v_org_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'clecia@servicelogic.com.br') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'clecia@servicelogic.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Clecia"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, departamento, role, status, recebe_transporte, organization_id)
    VALUES (v_user_id, v_user_id, 'clecia@servicelogic.com.br', 'Clecia', 'Implantação', 'colaborador', 'Ativo', false, v_org_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
