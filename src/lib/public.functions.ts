import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export interface PecaPublica {
  id: string;
  slug: string;
  titulo: string;
  autor: string | null;
  periodo: string | null;
  datacao: string | null;
  materiais: string | null;
  tecnica: string | null;
  dimensoes: string | null;
  descricao: string | null;
  historico: string | null;
  categoria_id: string | null;
  created_at: string;
}

const COLUNAS =
  "id, slug, titulo, autor, periodo, datacao, materiais, tecnica, dimensoes, descricao, historico, categoria_id, created_at";

export const listPecasPublicas = createServerFn({ method: "GET" }).handler(async (): Promise<PecaPublica[]> => {
  const { data, error } = await publicClient()
    .from("pecas")
    .select(COLUNAS)
    .eq("publico", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
});

export const getPecaPublica = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<PecaPublica | null> => {
    const { data: peca, error } = await publicClient()
      .from("pecas")
      .select(COLUNAS)
      .eq("publico", true)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    return peca;
  });
