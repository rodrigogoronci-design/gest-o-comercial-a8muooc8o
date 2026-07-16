-- Update RLS policies to allow Admins to see and manage all colaboradores
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_insert" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_delete" ON public.colaboradores;

CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.user_id = auth.uid() AND c.role = 'Admin'
    )
  );

CREATE POLICY "colaboradores_update" ON public.colaboradores
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.user_id = auth.uid() AND c.role = 'Admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.user_id = auth.uid() AND c.role = 'Admin'
    )
  );

CREATE POLICY "colaboradores_insert" ON public.colaboradores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.user_id = auth.uid() AND c.role = 'Admin'
    )
  );

CREATE POLICY "colaboradores_delete" ON public.colaboradores
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.colaboradores c
      WHERE c.user_id = auth.uid() AND c.role = 'Admin'
    )
  );

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

-- Seed Joao Vitor user
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Get Aline's organization_id for linking
  SELECT organization_id INTO v_org_id
  FROM public.colaboradores
  WHERE email = 'alinecosta@servicelogic.com.br'
  LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joaovitor@servicelogic.com.br') THEN
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
      'joaovitor@servicelogic.com.br',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Joao Vitor"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (id, user_id, email, nome, role, organization_id, recebe_transporte)
    VALUES (v_user_id, v_user_id, 'joaovitor@servicelogic.com.br', 'Joao Vitor', 'Colaborador', v_org_id, false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
