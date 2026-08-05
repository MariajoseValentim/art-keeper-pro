ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS ficha_tecnica_ficheiros jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.pecas
SET ficha_tecnica_ficheiros = jsonb_build_array(jsonb_build_object('path', ficha_tecnica_path, 'nome', coalesce(ficha_tecnica_nome, 'Documento')))
WHERE ficha_tecnica_path IS NOT NULL AND ficha_tecnica_ficheiros = '[]'::jsonb;

GRANT SELECT (ficha_tecnica_ficheiros) ON public.pecas TO anon;