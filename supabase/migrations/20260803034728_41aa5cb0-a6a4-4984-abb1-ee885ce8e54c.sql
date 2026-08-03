
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ roles ============
CREATE TYPE public.app_role AS ENUM ('admin','curador','visitante');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  apelido text,
  instituicao text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, apelido)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'apelido')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'curador') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ categorias ============
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL,
  descricao text,
  parent_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT SELECT ON public.categorias TO anon;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_all_own" ON public.categorias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ pecas ============
CREATE TABLE public.pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  inventario text,
  titulo text NOT NULL,
  slug text NOT NULL,
  autor text,
  escola text,
  datacao text,
  ano_inicio int,
  ano_fim int,
  periodo text,
  materiais text,
  tecnica text,
  dimensoes text,
  altura_cm numeric,
  largura_cm numeric,
  profundidade_cm numeric,
  peso_g numeric,
  proveniencia text,
  historico text,
  descricao text,
  bibliografia text,
  estado text NOT NULL DEFAULT 'bom',
  raridade text NOT NULL DEFAULT 'comum',
  autenticidade text NOT NULL DEFAULT 'por_avaliar',
  valor_estimado numeric,
  moeda text NOT NULL DEFAULT 'EUR',
  data_aquisicao date,
  localizacao text,
  notas_privadas text,
  publico boolean NOT NULL DEFAULT false,
  slug_publico text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
CREATE INDEX pecas_user_idx ON public.pecas(user_id);
CREATE INDEX pecas_publico_idx ON public.pecas(publico) WHERE publico;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pecas TO authenticated;
GRANT SELECT ON public.pecas TO anon;
GRANT ALL ON public.pecas TO service_role;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pecas_all_own" ON public.pecas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pecas_select_publicas" ON public.pecas FOR SELECT TO anon USING (publico = true);
CREATE TRIGGER pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ fotografias ============
CREATE TABLE public.fotografias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peca_id uuid NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  legenda text,
  ordem int NOT NULL DEFAULT 0,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fotografias_peca_idx ON public.fotografias(peca_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotografias TO authenticated;
GRANT SELECT ON public.fotografias TO anon;
GRANT ALL ON public.fotografias TO service_role;
ALTER TABLE public.fotografias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotografias_all_own" ON public.fotografias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fotografias_select_publicas" ON public.fotografias FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.pecas p WHERE p.id = peca_id AND p.publico = true));
CREATE TRIGGER fotografias_updated_at BEFORE UPDATE ON public.fotografias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ projetos ============
CREATE TABLE public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  slug text NOT NULL,
  tipo text NOT NULL DEFAULT 'exposicao',
  descricao text,
  estado text NOT NULL DEFAULT 'planeado',
  data_inicio date,
  data_fim date,
  local text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT ALL ON public.projetos TO service_role;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projetos_all_own" ON public.projetos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projeto_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  peca_id uuid NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  nota text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, peca_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projeto_pecas TO authenticated;
GRANT ALL ON public.projeto_pecas TO service_role;
ALTER TABLE public.projeto_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projeto_pecas_all_own" ON public.projeto_pecas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ restauros ============
CREATE TABLE public.restauros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peca_id uuid NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'conservacao',
  responsavel text,
  oficina text,
  descricao text,
  materiais_usados text,
  estado_antes text,
  estado_depois text,
  custo numeric,
  moeda text NOT NULL DEFAULT 'EUR',
  data_inicio date,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX restauros_peca_idx ON public.restauros(peca_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restauros TO authenticated;
GRANT ALL ON public.restauros TO service_role;
ALTER TABLE public.restauros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restauros_all_own" ON public.restauros FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER restauros_updated_at BEFORE UPDATE ON public.restauros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ certificados ============
CREATE TABLE public.certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peca_id uuid NOT NULL REFERENCES public.pecas(id) ON DELETE CASCADE,
  numero text NOT NULL,
  emitido_por text,
  data_emissao date NOT NULL DEFAULT current_date,
  validade date,
  observacoes text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificados TO authenticated;
GRANT ALL ON public.certificados TO service_role;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificados_all_own" ON public.certificados FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER certificados_updated_at BEFORE UPDATE ON public.certificados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ dossies ============
CREATE TABLE public.dossies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peca_id uuid REFERENCES public.pecas(id) ON DELETE CASCADE,
  projeto_id uuid REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'catalogo',
  conteudo text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dossies TO authenticated;
GRANT ALL ON public.dossies TO service_role;
ALTER TABLE public.dossies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dossies_all_own" ON public.dossies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER dossies_updated_at BEFORE UPDATE ON public.dossies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ auditoria ============
CREATE TABLE public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tabela text NOT NULL,
  registo_id uuid,
  accao text NOT NULL,
  resumo text,
  dados_antes jsonb,
  dados_depois jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auditoria_user_idx ON public.auditoria(user_id, created_at DESC);
GRANT SELECT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria_select_own" ON public.auditoria FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.registar_auditoria()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _rid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN _uid := OLD.user_id; _rid := OLD.id;
  ELSE _uid := NEW.user_id; _rid := NEW.id; END IF;
  INSERT INTO public.auditoria (user_id, tabela, registo_id, accao, dados_antes, dados_depois)
  VALUES (_uid, TG_TABLE_NAME, _rid, lower(TG_OP),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER auditoria_pecas AFTER INSERT OR UPDATE OR DELETE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();
CREATE TRIGGER auditoria_categorias AFTER INSERT OR UPDATE OR DELETE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();
CREATE TRIGGER auditoria_restauros AFTER INSERT OR UPDATE OR DELETE ON public.restauros FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();
CREATE TRIGGER auditoria_certificados AFTER INSERT OR UPDATE OR DELETE ON public.certificados FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();
CREATE TRIGGER auditoria_projetos AFTER INSERT OR UPDATE OR DELETE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();
CREATE TRIGGER auditoria_dossies AFTER INSERT OR UPDATE OR DELETE ON public.dossies FOR EACH ROW EXECUTE FUNCTION public.registar_auditoria();

-- ============ backups ============
CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'semanal',
  estado text NOT NULL DEFAULT 'concluido',
  storage_path text,
  tabelas text[],
  total_registos int,
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.backups TO authenticated;
GRANT ALL ON public.backups TO service_role;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backups_select_own" ON public.backups FOR SELECT TO authenticated USING (auth.uid() = user_id);
