DO $DO_BLOCK$
DECLARE
  client_record RECORD;
  matched_plano_id UUID;
  plano_str TEXT;
  db_code TEXT;
BEGIN
  FOR client_record IN SELECT id, modulos FROM public.clientes WHERE plano_id IS NULL AND modulos IS NOT NULL
  LOOP
    BEGIN
      plano_str := client_record.modulos->>'plano_base';
    EXCEPTION WHEN OTHERS THEN
      plano_str := NULL;
    END;

    IF plano_str IS NOT NULL AND plano_str != '' THEN
      db_code := CASE
        WHEN plano_str = 'TMS 50' THEN 'ERP-TMS-50'
        WHEN plano_str = 'TMS 100' THEN 'ERP-TMS-100'
        WHEN plano_str = 'TMS 200' THEN 'ERP-TMS-200'
        WHEN plano_str = 'TMS 300' THEN 'ERP-TMS-300'
        WHEN plano_str = 'TMS 500' THEN 'ERP-TMS-500'
        WHEN plano_str = 'MTS 1000' THEN 'ERP-MTS-1000'
        WHEN plano_str = 'TMS 3000' THEN 'ERP-TMS-3000'
        WHEN plano_str = 'TMS 5000' THEN 'ERP-TMS-5000'
        WHEN plano_str = 'TMS 5000+' THEN 'ERP-TMS-5000-PLUS'
        ELSE NULL
      END;

      IF db_code IS NOT NULL THEN
        SELECT id INTO matched_plano_id FROM public.planos_saude WHERE codigo = db_code LIMIT 1;
        IF matched_plano_id IS NOT NULL THEN
          UPDATE public.clientes SET plano_id = matched_plano_id WHERE id = client_record.id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END $DO_BLOCK$;
