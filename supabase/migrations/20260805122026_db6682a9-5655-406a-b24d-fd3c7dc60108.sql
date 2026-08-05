DROP POLICY IF EXISTS peca_documentos_insert_admin ON public.peca_documentos;
CREATE POLICY peca_documentos_insert_admin ON public.peca_documentos
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.pecas p WHERE p.id = peca_id)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;