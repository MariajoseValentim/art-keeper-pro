-- 1) Column-level restriction for anonymous access to pecas
REVOKE SELECT ON public.pecas FROM anon;
GRANT SELECT (
  id, slug, titulo, autor, escola, periodo, datacao, ano_inicio, ano_fim,
  materiais, tecnica, dimensoes, altura_cm, largura_cm, profundidade_cm, peso_g,
  descricao, historico, bibliografia, categoria_id, publico, slug_publico,
  created_at, updated_at
) ON public.pecas TO anon;

-- 2) Restrict execution of SECURITY DEFINER trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registar_auditoria() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role must stay executable: RLS policies evaluate it as the calling role
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;