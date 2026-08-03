/**
 * Extração de texto de PDF, Word (.docx) e texto simples,
 * e conversão desse texto em registos de peças (campo: valor).
 */

import { COLUNAS_PECA } from "./documentos";

const SEM_ACENTOS = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Sinónimos aceites nas etiquetas dos documentos → coluna da ficha. */
const ALIAS: Record<string, string> = {
  titulo: "titulo",
  designacao: "titulo",
  denominacao: "titulo",
  nome: "titulo",
  slug: "slug",
  inventario: "inventario",
  "n inventario": "inventario",
  "no inventario": "inventario",
  "numero de inventario": "inventario",
  referencia: "inventario",
  autor: "autor",
  "autor/fabricante": "autor",
  fabricante: "autor",
  oficina: "autor",
  escola: "escola",
  periodo: "periodo",
  epoca: "periodo",
  datacao: "datacao",
  data: "datacao",
  "ano inicio": "ano_inicio",
  ano_inicio: "ano_inicio",
  "ano fim": "ano_fim",
  ano_fim: "ano_fim",
  materiais: "materiais",
  material: "materiais",
  materia: "materiais",
  tecnica: "tecnica",
  dimensoes: "dimensoes",
  medidas: "dimensoes",
  altura: "altura_cm",
  altura_cm: "altura_cm",
  largura: "largura_cm",
  largura_cm: "largura_cm",
  profundidade: "profundidade_cm",
  profundidade_cm: "profundidade_cm",
  peso: "peso_g",
  peso_g: "peso_g",
  proveniencia: "proveniencia",
  origem: "proveniencia",
  historico: "historico",
  historia: "historico",
  descricao: "descricao",
  bibliografia: "bibliografia",
  estado: "estado",
  "estado de conservacao": "estado",
  conservacao: "estado",
  raridade: "raridade",
  autenticidade: "autenticidade",
  "valor estimado": "valor_estimado",
  valor: "valor_estimado",
  avaliacao: "valor_estimado",
  moeda: "moeda",
  "data de aquisicao": "data_aquisicao",
  aquisicao: "data_aquisicao",
  data_aquisicao: "data_aquisicao",
  localizacao: "localizacao",
  publico: "publico",
  notas: "notas_privadas",
  "notas privadas": "notas_privadas",
  categoria: "categoria",
  coleccao: "categoria",
  colecao: "categoria",
};

for (const coluna of COLUNAS_PECA) ALIAS[SEM_ACENTOS(coluna.replace(/_/g, " "))] ??= coluna;

export function extensao(nome: string) {
  return nome.toLowerCase().split(".").pop() ?? "";
}

export const EXTENSOES_TEXTO = ["pdf", "docx", "doc", "txt", "md", "rtf"];

type ItemTextoPdf = {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
};

/**
 * O PDF.js devolve frequentemente cada palavra como um elemento isolado e sem
 * `hasEOL`. Reagrupamos os elementos pela coordenada vertical para preservar
 * as linhas "Etiqueta: valor" que o importador reconhece.
 */
function linhasDaPaginaPdf(items: ItemTextoPdf[]): string[] {
  const posicionados = items.filter(
    (item) => item.str?.trim() && item.transform && item.transform.length >= 6,
  );

  if (!posicionados.length) {
    const linhas: string[] = [];
    let linha = "";
    for (const item of items) {
      const texto = item.str ?? "";
      linha += linha && texto && !/^\s/.test(texto) ? ` ${texto}` : texto;
      if (item.hasEOL) {
        if (linha.trim()) linhas.push(linha.trim());
        linha = "";
      }
    }
    if (linha.trim()) linhas.push(linha.trim());
    return linhas;
  }

  const linhas: { y: number; items: ItemTextoPdf[] }[] = [];
  for (const item of posicionados) {
    const y = item.transform?.[5] ?? 0;
    const existente = linhas.find((linha) => Math.abs(linha.y - y) <= 2);
    if (existente) existente.items.push(item);
    else linhas.push({ y, items: [item] });
  }

  return linhas
    .sort((a, b) => b.y - a.y)
    .map((linha) => {
      const ordenados = linha.items.sort(
        (a, b) => (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0),
      );
      let resultado = "";
      let fimAnterior: number | null = null;
      for (const item of ordenados) {
        const texto = item.str ?? "";
        const x = item.transform?.[4] ?? 0;
        const precisaEspaco =
          resultado.length > 0 &&
          !resultado.endsWith(" ") &&
          !texto.startsWith(" ") &&
          fimAnterior != null &&
          x - fimAnterior > 1;
        resultado += `${precisaEspaco ? " " : ""}${texto}`;
        fimAnterior = x + (item.width ?? 0);
      }
      return resultado.trim();
    })
    .filter(Boolean);
}

/** Lê o texto de um ficheiro PDF, Word ou de texto simples. */
export async function extrairTexto(ficheiro: File): Promise<string> {
  const ext = extensao(ficheiro.name);

  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: await ficheiro.arrayBuffer() }).promise;
    const paginas: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const conteudo = await pagina.getTextContent();
      const linhas = linhasDaPaginaPdf(conteudo.items as ItemTextoPdf[]);
      paginas.push(linhas.join("\n"));
    }
    const texto = paginas.join("\n\n@@PAGINA@@\n\n").trim();
    if (!texto) {
      throw new Error(
        "O PDF não contém texto selecionável. Se for uma digitalização, aplique OCR antes de importar.",
      );
    }
    return texto;
  }

  if (ext === "doc") {
    throw new Error("O formato Word antigo .doc não é suportado. Guarde o documento como .docx e tente novamente.");
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await ficheiro.arrayBuffer() });
    return value;
  }

  return ficheiro.text();
}

/**
 * Converte texto livre em registos.
 * Cada bloco (página, linha em branco dupla ou separador ---) é uma peça;
 * dentro do bloco procuram-se linhas "Etiqueta: valor".
 */
export function textoParaRegistos(texto: string): Record<string, string>[] {
  const limpo = texto.replace(/\r\n?/g, "\n");
  const blocos = limpo
    .split(/\n\s*(?:@@PAGINA@@|-{3,}|={3,}|\*{3,})\s*\n|\n{3,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const registos: Record<string, string>[] = [];

  for (const bloco of blocos) {
    let registo: Record<string, string> = {};
    let ultima: string | null = null;

    const guardar = () => {
      if (registo["titulo"]) registos.push(registo);
      registo = {};
      ultima = null;
    };

    for (const linhaBruta of bloco.split("\n")) {
      const linha = linhaBruta.trim();
      if (!linha) continue;
      const par = linha.match(/^([^:]{2,40}?)\s*[:\u2013-]\s+(.*)$/) ?? linha.match(/^([^:]{2,40}?):\s*(.*)$/);
      const chave = par ? ALIAS[SEM_ACENTOS(par[1] ?? "")] : undefined;
      if (par && chave) {
        // Muitos documentos têm várias fichas seguidas sem página em branco.
        // Uma segunda etiqueta de título inicia inequivocamente uma nova peça.
        if (chave === "titulo" && registo["titulo"]) guardar();
        registo[chave] = registo[chave] ? `${registo[chave]} ${par[2]}`.trim() : (par[2] ?? "").trim();
        ultima = chave;
      } else if (ultima) {
        registo[ultima] = `${registo[ultima]} ${linha}`.trim();
      } else if (!registo["titulo"]) {
        registo["titulo"] = linha;
        ultima = "titulo";
      }
    }

    guardar();
  }

  return registos;
}
