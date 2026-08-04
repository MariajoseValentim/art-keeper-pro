ALTER TABLE public.pecas
  ADD COLUMN IF NOT EXISTS ficha_tecnica text,
  ADD COLUMN IF NOT EXISTS ficha_tecnica_path text,
  ADD COLUMN IF NOT EXISTS ficha_tecnica_nome text;