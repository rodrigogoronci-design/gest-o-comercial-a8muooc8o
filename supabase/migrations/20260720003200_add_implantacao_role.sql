INSERT INTO public.roles (name, description)
VALUES ('Implantação', 'Acesso técnico para gestão de implantações')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description)
VALUES
  ('view_implementacoes', 'Visualizar projetos de implantação'),
  ('edit_implementacoes', 'Editar etapas e detalhes de implantações'),
  ('view_clientes_basic', 'Visualizar dados básicos de clientes')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  role_id_val uuid;
  perm_view_impl uuid;
  perm_edit_impl uuid;
  perm_view_cli uuid;
BEGIN
  SELECT id INTO role_id_val FROM public.roles WHERE name = 'Implantação';
  SELECT id INTO perm_view_impl FROM public.permissions WHERE name = 'view_implementacoes';
  SELECT id INTO perm_edit_impl FROM public.permissions WHERE name = 'edit_implementacoes';
  SELECT id INTO perm_view_cli FROM public.permissions WHERE name = 'view_clientes_basic';

  IF role_id_val IS NOT NULL AND perm_view_impl IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (role_id_val, perm_view_impl)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  IF role_id_val IS NOT NULL AND perm_edit_impl IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (role_id_val, perm_edit_impl)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  IF role_id_val IS NOT NULL AND perm_view_cli IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (role_id_val, perm_view_cli)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;
