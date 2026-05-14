DO $$
DECLARE
  v_user_id uuid;
  v_colab_id uuid;
BEGIN
  -- Ensure auth.users has the user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alinecosta@servicelogic.com.br' LIMIT 1;
  
  IF v_user_id IS NULL THEN
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
      'alinecosta@servicelogic.com.br',
      crypt('Skip@Pass123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Aline Costa"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- Ensure user is in colaboradores and has Admin role
  SELECT id INTO v_colab_id FROM public.colaboradores WHERE user_id = v_user_id LIMIT 1;
  
  IF v_colab_id IS NULL THEN
    -- Check by email
    SELECT id INTO v_colab_id FROM public.colaboradores WHERE email = 'alinecosta@servicelogic.com.br' LIMIT 1;
    
    IF v_colab_id IS NOT NULL THEN
      UPDATE public.colaboradores SET user_id = v_user_id, role = 'Admin' WHERE id = v_colab_id;
    ELSE
      INSERT INTO public.colaboradores (
        id, user_id, email, nome, role, recebe_transporte
      ) VALUES (
        v_user_id, v_user_id, 'alinecosta@servicelogic.com.br', 'Aline Costa', 'Admin', false
      );
    END IF;
  ELSE
    UPDATE public.colaboradores SET role = 'Admin' WHERE id = v_colab_id;
  END IF;
END $$;
