export interface FichaFicheiro {
  path: string;
  nome: string;
}

/** Lê a lista de ficheiros da ficha técnica, aceitando o formato antigo (1 ficheiro). */
export function lerFichaFicheiros(peca: {
  ficha_tecnica_ficheiros?: unknown;
  ficha_tecnica_path?: string | null;
  ficha_tecnica_nome?: string | null;
}): FichaFicheiro[] {
  const bruto = peca.ficha_tecnica_ficheiros;
  const lista: FichaFicheiro[] = Array.isArray(bruto)
    ? bruto
        .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
        .map((i) => ({
          path: typeof i["path"] === "string" ? (i["path"] as string) : "",
          nome:
            typeof i["nome"] === "string" && i["nome"] ? (i["nome"] as string) : "Documento",
        }))
        .filter((i) => i.path)
    : [];
  if (lista.length === 0 && peca.ficha_tecnica_path) {
    return [{ path: peca.ficha_tecnica_path, nome: peca.ficha_tecnica_nome ?? "Documento" }];
  }
  return lista;
}
