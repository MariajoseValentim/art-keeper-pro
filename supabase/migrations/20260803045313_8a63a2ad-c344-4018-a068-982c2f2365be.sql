-- 1) Novos utilizadores ficam sem acesso (visitante)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, apelido)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'apelido')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visitante') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;

-- 2) Administrador inicial
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'rogerio.caroco@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Helper: pode consultar (curador ou admin)
CREATE OR REPLACE FUNCTION public.pode_consultar(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','curador')
  );
$function$;

-- 4) Políticas: leitura para curador/admin, escrita só admin
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias','pecas','fotografias','projetos','projeto_pecas','restauros','certificados','dossies']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all_own', t);

    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (public.pode_consultar(auth.uid()))$f$, t || '_select_equipa', t);

    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id)$f$, t || '_insert_admin', t);

    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'))$f$, t || '_update_admin', t);

    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))$f$, t || '_delete_admin', t);
  END LOOP;
END $$;