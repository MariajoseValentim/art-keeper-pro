DROP POLICY IF EXISTS "Owners manage their piece documents" ON public.peca_documentos;

CREATE POLICY "peca_documentos_select_equipa" ON public.peca_documentos
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'curador'));

CREATE POLICY "peca_documentos_insert_admin" ON public.peca_documentos
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "peca_documentos_update_admin" ON public.peca_documentos
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "peca_documentos_delete_admin" ON public.peca_documentos
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));