DO $DO$
DECLARE
  v_user_id uuid;
  v_colab_id uuid;
BEGIN
  -- Fix auth.users nulls that cause HTTP 500 errors on login
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, '')
  WHERE
    confirmation_token IS NULL OR recovery_token IS NULL
    OR email_change_token_new IS NULL OR email_change IS NULL
    OR email_change_token_current IS NULL
    OR phone_change IS NULL OR phone_change_token IS NULL
    OR reauthentication_token IS NULL;

  -- Ensure auth.users has the default user and password is correct
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
  ELSE
    -- Reset password just in case it was changed or corrupted, and ensure email is confirmed
    UPDATE auth.users
    SET 
      encrypted_password = crypt('Skip@Pass123!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
  END IF;

  -- Ensure user is linked in colaboradores and has Admin role
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
END $DO$;
