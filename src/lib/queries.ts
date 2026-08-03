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
