import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoriaRow, PecaRow } from "./collection";

export const pecasQuery = () =>
  queryOptions({
    queryKey: ["pecas"],
    queryFn: async (): Promise<PecaRow[]> => {
      const { data, error } = await supabase
        .from("pecas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const pecaQuery = (id: string) =>
  queryOptions({
    queryKey: ["pecas", id],
    queryFn: async (): Promise<PecaRow | null> => {
      const { data, error } = await supabase.from("pecas").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const categoriasQuery = () =>
  queryOptions({
    queryKey: ["categorias"],
    queryFn: async (): Promise<CategoriaRow[]> => {
      const { data, error } = await supabase.from("categorias").select("*").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

export type MidiaItem = {
  id: string;
  storage_path: string;
  legenda: string | null;
  principal: boolean;
  ordem: number;
  url: string | null;
};

export const midiaQuery = (pecaId: string) =>
  queryOptions({
    queryKey: ["midia", pecaId],
    queryFn: async (): Promise<MidiaItem[]> => {
      const { data, error } = await supabase
        .from("fotografias")
        .select("id, storage_path, legenda, principal, ordem")
        .eq("peca_id", pecaId)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const linhas = data ?? [];
      if (linhas.length === 0) return [];
      const { data: assinados } = await supabase.storage
        .from("fotografias")
        .createSignedUrls(
          linhas.map((l) => l.storage_path),
          60 * 60,
        );
      const mapa = new Map((assinados ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      return linhas.map((l) => ({ ...l, url: mapa.get(l.storage_path) ?? null }));
    },
  });

export type Capa = { pecaId: string; url: string; video: boolean };

export const isVideoPath = (path: string) => /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(path);

/** Miniatura de identificação (imagem principal, ou o primeiro ficheiro) de cada peça. */
export const capasQuery = () =>
  queryOptions({
    queryKey: ["capas"],
    queryFn: async (): Promise<Record<string, Capa>> => {
      const { data, error } = await supabase
        .from("fotografias")
        .select("peca_id, storage_path, principal, ordem")
        .order("principal", { ascending: false })
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const linhas = data ?? [];
      const escolhidas = new Map<string, string>();
      for (const l of linhas) {
        if (!escolhidas.has(l.peca_id)) escolhidas.set(l.peca_id, l.storage_path);
      }
      if (escolhidas.size === 0) return {};
      const caminhos = [...escolhidas.values()];
      const { data: assinados } = await supabase.storage
        .from("fotografias")
        .createSignedUrls(caminhos, 60 * 60);
      const urls = new Map((assinados ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      const capas: Record<string, Capa> = {};
      for (const [pecaId, path] of escolhidas) {
        const url = urls.get(path);
        if (url) capas[pecaId] = { pecaId, url, video: isVideoPath(path) };
      }
      return capas;
    },
  });


export const auditoriaQuery = () =>
  queryOptions({
    queryKey: ["auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

export type DocumentoPeca = {
  id: string;
  storage_path: string;
  nome: string;
  tipo: string | null;
  tamanho: number | null;
  descricao: string | null;
  created_at: string;
};

export const documentosPecaQuery = (pecaId: string) =>
  queryOptions({
    queryKey: ["documentos-peca", pecaId],
    queryFn: async (): Promise<DocumentoPeca[]> => {
      const { data, error } = await supabase
        .from("peca_documentos")
        .select("id, storage_path, nome, tipo, tamanho, descricao, created_at")
        .eq("peca_id", pecaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
