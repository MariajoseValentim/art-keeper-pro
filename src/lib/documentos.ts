/**
 * Importação / exportação de documentos da coleção (CSV e JSON)
 * e impressão de fichas museológicas em PDF (via diálogo de impressão).
 */

export const COLUNAS_PECA = [
  "titulo",
  "slug",
  "inventario",
  "autor",
  "escola",
  "periodo",
  "datacao",
  "ano_inicio",
  "ano_fim",
  "materiais",
  "tecnica",
  "dimensoes",
  "altura_cm",
  "largura_cm",
  "profundidade_cm",
  "peso_g",
  "proveniencia",
  "historico",
  "descricao",
  "bibliografia",
  "estado",
  "raridade",
  "autenticidade",
  "valor_estimado",
  "moeda",
  "data_aquisicao",
  "localizacao",
  "publico",
  "notas_privadas",
  "categoria",
] as const;

export type ColunaPeca = (typeof COLUNAS_PECA)[number];

const NUMERICAS: ColunaPeca[] = [
  "ano_inicio",
  "ano_fim",
  "altura_cm",
  "largura_cm",
  "profundidade_cm",
  "peso_g",
  "valor_estimado",
];

const BOOLEANAS: ColunaPeca[] = ["publico"];

/* ---------- CSV ---------- */

function escapar(valor: unknown): string {
  if (valor == null) return "";
  const texto = String(valor);
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function paraCSV(linhas: Record<string, unknown>[], colunas: readonly string[]): string {
  const cabecalho = colunas.join(",");
  const corpo = linhas.map((l) => colunas.map((c) => escapar(l[c])).join(","));
  return "\uFEFF" + [cabecalho, ...corpo].join("\n");
}

/** Parser CSV tolerante (aspas, quebras de linha, separador , ou ;). */
export function lerCSV(texto: string): Record<string, string>[] {
  const limpo = texto.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const primeiraLinha = limpo.split("\n")[0] ?? "";
  const sep = (primeiraLinha.match(/;/g)?.length ?? 0) > (primeiraLinha.match(/,/g)?.length ?? 0) ? ";" : ",";

  const linhas: string[][] = [];
  let campo = "";
  let atual: string[] = [];
  let aspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (aspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
      continue;
    }
    if (c === '"') aspas = true;
    else if (c === sep) {
      atual.push(campo);
      campo = "";
    } else if (c === "\n") {
      atual.push(campo);
      linhas.push(atual);
      atual = [];
      campo = "";
    } else campo += c;
  }
  if (campo.length || atual.length) {
    atual.push(campo);
    linhas.push(atual);
  }

  const [cabecalho, ...resto] = linhas.filter((l) => l.some((v) => v.trim() !== ""));
  if (!cabecalho) return [];
  const chaves = cabecalho.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return resto.map((linha) => {
    const registo: Record<string, string> = {};
    chaves.forEach((chave, i) => {
      registo[chave] = (linha[i] ?? "").trim();
    });
    return registo;
  });
}

/* ---------- Normalização para a base de dados ---------- */

export type PecaImportada = Record<string, string | number | boolean | null>;

export function normalizarPeca(registo: Record<string, string>): PecaImportada | null {
  const titulo = registo["titulo"] ?? registo["título"] ?? registo["title"];
  if (!titulo) return null;

  const saida: PecaImportada = { titulo };
  for (const coluna of COLUNAS_PECA) {
    if (coluna === "titulo") continue;
    const bruto = registo[coluna];
    if (bruto == null || bruto === "") continue;
    if (NUMERICAS.includes(coluna)) {
      const numero = Number(bruto.replace(/\s/g, "").replace(",", "."));
      if (!Number.isNaN(numero)) saida[coluna] = numero;
    } else if (BOOLEANAS.includes(coluna)) {
      saida[coluna] = /^(1|true|sim|yes|s|y)$/i.test(bruto);
    } else {
      saida[coluna] = bruto;
    }
  }
  return saida;
}

/* ---------- Descarregar ficheiros ---------- */

export function descarregar(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nomeFicheiro(base: string, extensao: string) {
  const data = new Date().toISOString().slice(0, 10);
  return `${base}-${data}.${extensao}`;
}

/* ---------- Impressão / PDF ---------- */

/** Abre o diálogo de impressão (permite "Guardar como PDF"). */
export function imprimirFicha(titulo?: string) {
  const anterior = document.title;
  if (titulo) document.title = titulo;
  const repor = () => {
    document.title = anterior;
    window.removeEventListener("afterprint", repor);
  };
  window.addEventListener("afterprint", repor);
  window.print();
  setTimeout(repor, 2000);
}
