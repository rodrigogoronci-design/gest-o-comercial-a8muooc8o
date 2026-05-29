DO $$
BEGIN
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS isencao_periodo integer DEFAULT 0;
  ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS isencao_periodo integer DEFAULT 0;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.crm_propostas;
  CREATE POLICY "Allow all access to authenticated users" ON public.crm_propostas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.historico_contratos;
  CREATE POLICY "Allow all access to authenticated users" ON public.historico_contratos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
      NULL, '', '', ''
    );

    INSERT INTO public.colaboradores (
      id, user_id, email, nome, role, recebe_transporte
    ) VALUES (
      new_user_id, new_user_id, 'alinecosta@servicelogic.com.br', 'Aline Costa', 'Admin', true
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
