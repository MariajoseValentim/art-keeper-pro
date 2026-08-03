-- Substituir dependência da função restrita por verificação direta
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias','pecas','fotografias','projetos','projeto_pecas','restauros','certificados','dossies']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_equipa', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles ur
                     WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','curador')))$f$,
      t || '_select_equipa', t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.pode_consultar(uuid);

-- Storage: leitura para equipa, escrita só admin
DROP POLICY IF EXISTS "fotografias_equipa_select" ON storage.objects;
CREATE POLICY "fotografias_equipa_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('fotografias','documentos')
  AND EXISTS (SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','curador'))
);

DROP POLICY IF EXISTS "fotografias_admin_insert" ON storage.objects;
CREATE POLICY "fotografias_admin_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('fotografias','documentos') AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "fotografias_admin_update" ON storage.objects;
CREATE POLICY "fotografias_admin_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('fotografias','documentos') AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id IN ('fotografias','documentos') AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "fotografias_admin_delete" ON storage.objects;
CREATE POLICY "fotografias_admin_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('fotografias','documentos') AND public.has_role(auth.uid(), 'admin'));