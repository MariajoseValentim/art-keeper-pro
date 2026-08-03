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

export interface MidiaPublica {
  url: string;
  video: boolean;
  legenda: string | null;
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
  capa: MidiaPublica | null;
  midia?: MidiaPublica[];
}

const COLUNAS =
  "id, slug, titulo, autor, periodo, datacao, materiais, tecnica, dimensoes, descricao, historico, categoria_id, created_at";

const isVideoPath = (path: string) => /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(path);

/** Lê a média das peças indicadas (já validadas como públicas) e assina URLs temporários. */
async function midiaDePecas(pecaIds: string[]): Promise<Map<string, MidiaPublica[]>> {
  const resultado = new Map<string, MidiaPublica[]>();
  if (pecaIds.length === 0) return resultado;

  const { data } = await publicClient()
    .from("fotografias")
    .select("peca_id, storage_path, legenda, principal, ordem")
    .in("peca_id", pecaIds)
    .order("principal", { ascending: false })
    .order("ordem", { ascending: true });
  const linhas = data ?? [];
  if (linhas.length === 0) return resultado;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: assinados } = await supabaseAdmin.storage
    .from("fotografias")
    .createSignedUrls(
      linhas.map((l) => l.storage_path),
      60 * 60,
    );
  const urls = new Map((assinados ?? []).map((s) => [s.path ?? "", s.signedUrl]));

  for (const l of linhas) {
    const url = urls.get(l.storage_path);
    if (!url) continue;
    const lista = resultado.get(l.peca_id) ?? [];
    lista.push({ url, video: isVideoPath(l.storage_path), legenda: l.legenda });
    resultado.set(l.peca_id, lista);
  }
  return resultado;
}

export const listPecasPublicas = createServerFn({ method: "GET" }).handler(async (): Promise<PecaPublica[]> => {
  const { data, error } = await publicClient()
    .from("pecas")
    .select(COLUNAS)
    .eq("publico", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  const pecas = data ?? [];
  const midia = await midiaDePecas(pecas.map((p) => p.id));
  return pecas.map((p) => ({ ...p, capa: midia.get(p.id)?.[0] ?? null }));
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
    if (!peca) return null;
    const midia = (await midiaDePecas([peca.id])).get(peca.id) ?? [];
    return { ...peca, capa: midia[0] ?? null, midia };
  });
