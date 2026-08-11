ALTER TABLE public.agenda_eventos ADD COLUMN IF NOT EXISTS link_reuniao text;
ALTER TABLE public.agenda_eventos ADD COLUMN IF NOT EXISTS gravacao_url text;
