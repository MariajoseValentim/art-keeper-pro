CREATE TABLE public.peca_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  peca_id UUID NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX peca_documentos_peca_id_idx ON public.peca_documentos(peca_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peca_documentos TO authenticated;
GRANT ALL ON public.peca_documentos TO service_role;
ALTER TABLE public.peca_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their piece documents" ON public.peca_documentos
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);