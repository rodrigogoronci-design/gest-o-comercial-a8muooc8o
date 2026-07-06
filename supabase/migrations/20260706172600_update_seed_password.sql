-- Update seed user password to Skip@Pass (as required by user story)
UPDATE auth.users
SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
WHERE email = 'alinecosta@servicelogic.com.br';

-- Ensure colaboradores record exists for seed user
INSERT INTO public.colaboradores (user_id, email, nome, role, recebe_transporte)
SELECT id, email, 'Aline Costa', 'Admin', true
FROM auth.users
WHERE email = 'alinecosta@servicelogic.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM public.colaboradores WHERE user_id = auth.users.id
  )
ON CONFLICT DO NOTHING;
