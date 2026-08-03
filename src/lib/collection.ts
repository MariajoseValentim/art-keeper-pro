import type { Database } from "@/integrations/supabase/types";

export type PecaRow = Database["public"]["Tables"]["pecas"]["Row"];
export type CategoriaRow = Database["public"]["Tables"]["categorias"]["Row"];
export type AuditoriaRow = Database["public"]["Tables"]["auditoria"]["Row"];

export type Estado = "excelente" | "bom" | "razoavel" | "a_restaurar";
export type Raridade = "comum" | "incomum" | "raro" | "excecional";
export type Autenticidade = "certificada" | "atribuida" | "por_avaliar";

export const estadoLabel: Record<Estado, string> = {
  excelente: "Excelente",
  bom: "Bom",
  razoavel: "Razoável",
  a_restaurar: "A restaurar",
};

export const raridadeLabel: Record<Raridade, string> = {
  comum: "Comum",
  incomum: "Incomum",
  raro: "Raro",
  excecional: "Excecional",
};

export const autenticidadeLabel: Record<Autenticidade, string> = {
  certificada: "Certificada",
  atribuida: "Atribuída",
  por_avaliar: "Por avaliar",
};

export function label<T extends string>(map: Record<T, string>, value: string | null): string {
  if (!value) return "—";
  return (map as Record<string, string>)[value] ?? value;
}

export function formatEuro(valor: number | null, moeda = "EUR"): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: moeda || "EUR",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
