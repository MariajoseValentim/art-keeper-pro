import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = "admin" | "curador" | "visitante";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfis, setPerfis] = useState<Perfil[] | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setPerfis(null);
      return;
    }
    let ativo = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (ativo) setPerfis((data ?? []).map((r) => r.role as Perfil));
      });
    return () => {
      ativo = false;
    };
  }, [userId]);

  const isAdmin = perfis?.includes("admin") ?? false;
  const podeConsultar = isAdmin || (perfis?.includes("curador") ?? false);

  return {
    session,
    user: session?.user ?? null,
    loading,
    perfis,
    perfisCarregados: perfis !== null,
    isAdmin,
    podeConsultar,
  };
}
