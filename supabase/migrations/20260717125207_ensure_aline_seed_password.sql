INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current,
  phone, phone_change, phone_change_token, reauthentication_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'alinecosta@servicelogic.com.br',
  crypt('Skip@Pass', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Aline Costa"}',
  false, 'authenticated', 'authenticated',
  '', '', '', '', '',
  NULL, '', '', ''
)
ON CONFLICT (email) DO UPDATE
SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  reauthentication_token = '';

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alinecosta@servicelogic.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.colaboradores (id, user_id, email, nome, role, recebe_transporte)
    VALUES (v_user_id, v_user_id, 'alinecosta@servicelogic.com.br', 'Aline Costa', 'Admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
