import saoMiguel from "@/assets/sao-miguel.jpg";

/**
 * Camada de dados da coleção.
 *
 * Neste momento serve dados de demonstração em memória. Quando a base de dados
 * Supabase estiver ligada, substitua apenas as funções `list*` / `get*` por
 * consultas — os componentes não precisam de mudar.
 */

export type Estado = "excelente" | "bom" | "razoavel" | "a_restaurar";
export type Raridade = "comum" | "incomum" | "raro" | "excecional";
export type Autenticidade = "certificada" | "atribuida" | "por_avaliar";

export interface Peca {
  id: string;
  slug: string;
  inventario: string;
  titulo: string;
  autor: string;
  periodo: string;
  categoria: string;
  materiais: string;
  dimensoes: string;
  proveniencia: string;
  estado: Estado;
  raridade: Raridade;
  autenticidade: Autenticidade;
  valor: number;
  publica: boolean;
  aquisicao: string;
  notas: string;
  imagem: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
}

export interface Atividade {
  id: string;
  data: string;
  autor: string;
  accao: string;
  alvo: string;
}

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

export const categorias: Categoria[] = [
  { id: "pintura", nome: "Pintura", descricao: "Óleo, têmpera e técnicas mistas sobre tela ou madeira" },
  { id: "escultura", nome: "Escultura", descricao: "Talha, bronze, mármore e terracota" },
  { id: "ceramica", nome: "Cerâmica e Faiança", descricao: "Louça de fábrica, azulejaria e porcelana" },
  { id: "mobiliario", nome: "Mobiliário", descricao: "Peças de aparato e de uso doméstico" },
  { id: "documento", nome: "Documentação", descricao: "Manuscritos, gravuras e cartografia" },
];

const pecas: Peca[] = [
  {
    id: "1",
    slug: "retrato-de-dama-com-leque",
    inventario: "INV-0001",
    titulo: "Retrato de Dama com Leque",
    autor: "Atribuído a José Malhoa",
    periodo: "c. 1898",
    categoria: "pintura",
    materiais: "Óleo sobre tela",
    dimensoes: "72 × 54 cm",
    proveniencia: "Coleção particular, Lisboa; leilão Cabral Moncada, 2011",
    estado: "bom",
    raridade: "raro",
    autenticidade: "atribuida",
    valor: 48000,
    publica: true,
    aquisicao: "2011-06-14",
    notas: "Reentelagem parcial no quadrante inferior direito. Moldura original em talha dourada.",
    imagem:
      "https://images.unsplash.com/photo-1577720580479-7d839d829c73?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    slug: "jarra-de-faianca-das-caldas",
    inventario: "INV-0002",
    titulo: "Jarra de Faiança das Caldas",
    autor: "Fábrica Rafael Bordalo Pinheiro",
    periodo: "1890–1905",
    categoria: "ceramica",
    materiais: "Faiança vidrada policromada",
    dimensoes: "41 cm (altura)",
    proveniencia: "Herança familiar, Caldas da Rainha",
    estado: "excelente",
    raridade: "incomum",
    autenticidade: "certificada",
    valor: 6200,
    publica: true,
    aquisicao: "2004-03-02",
    notas: "Marca de fábrica incisa na base. Sem restauros conhecidos.",
    imagem:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    slug: "sao-miguel-arcanjo",
    inventario: "INV-0003",
    titulo: "São Miguel Arcanjo",
    autor: "Oficina do norte de Portugal",
    periodo: "Séc. XVII",
    categoria: "escultura",
    materiais: "Madeira policromada e dourada",
    dimensoes: "88 × 34 × 28 cm",
    proveniencia: "Antigo oratório privado, Braga",
    estado: "a_restaurar",
    raridade: "excecional",
    autenticidade: "por_avaliar",
    valor: 31000,
    publica: false,
    aquisicao: "2019-11-27",
    notas: "Perdas de policromia na base e ataque xilófago inativo. Proposta de intervenção em curso.",
    imagem: saoMiguel,
  },
  {
    id: "4",
    slug: "contador-indo-portugues",
    inventario: "INV-0004",
    titulo: "Contador Indo-Português",
    autor: "Oficina de Goa",
    periodo: "Séc. XVIII",
    categoria: "mobiliario",
    materiais: "Teca, ébano e embutidos de marfim",
    dimensoes: "58 × 76 × 41 cm",
    proveniencia: "Casa senhorial do Alentejo",
    estado: "bom",
    raridade: "raro",
    autenticidade: "certificada",
    valor: 74000,
    publica: true,
    aquisicao: "2016-09-08",
    notas: "Ferragens originais. Uma gaveta com fecho substituído no séc. XX.",
    imagem:
      "https://images.unsplash.com/photo-1550226891-ef816aed4a98?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "5",
    slug: "carta-nautica-do-atlantico",
    inventario: "INV-0005",
    titulo: "Carta Náutica do Atlântico Sul",
    autor: "Anónimo",
    periodo: "1721",
    categoria: "documento",
    materiais: "Tinta e aguarela sobre pergaminho",
    dimensoes: "63 × 91 cm",
    proveniencia: "Alfarrabista, Porto, 1998",
    estado: "razoavel",
    raridade: "excecional",
    autenticidade: "atribuida",
    valor: 22500,
    publica: false,
    aquisicao: "1998-05-19",
    notas: "Acidificação do suporte. Conservada em pasta livre de ácido, sem exposição à luz.",
    imagem:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "6",
    slug: "natureza-morta-com-romas",
    inventario: "INV-0006",
    titulo: "Natureza-morta com Romãs",
    autor: "Escola espanhola",
    periodo: "Séc. XIX",
    categoria: "pintura",
    materiais: "Óleo sobre madeira",
    dimensoes: "38 × 46 cm",
    proveniencia: "Galeria Madrid, 2007",
    estado: "excelente",
    raridade: "comum",
    autenticidade: "por_avaliar",
    valor: 9800,
    publica: true,
    aquisicao: "2007-02-11",
    notas: "Verniz uniformizado em 2015.",
    imagem:
      "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?auto=format&fit=crop&w=1200&q=80",
  },
];

export const atividade: Atividade[] = [
  { id: "a1", data: "2026-07-31", autor: "Curadoria", accao: "Ficha atualizada", alvo: "INV-0003 · São Miguel Arcanjo" },
  { id: "a2", data: "2026-07-29", autor: "Conservação", accao: "Relatório de estado", alvo: "INV-0005 · Carta Náutica" },
  { id: "a3", data: "2026-07-24", autor: "Curadoria", accao: "Peça tornada pública", alvo: "INV-0004 · Contador Indo-Português" },
  { id: "a4", data: "2026-07-18", autor: "Sistema", accao: "Backup semanal concluído", alvo: "6 tabelas exportadas" },
];

export function listPecas(): Peca[] {
  return pecas;
}

export function getPeca(slug: string): Peca | undefined {
  return pecas.find((p) => p.slug === slug);
}

export function categoriaNome(id: string): string {
  return categorias.find((c) => c.id === id)?.nome ?? id;
}

export function formatEuro(valor: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function estatisticas() {
  const total = pecas.length;
  const valor = pecas.reduce((soma, p) => soma + p.valor, 0);
  const publicas = pecas.filter((p) => p.publica).length;
  const aRestaurar = pecas.filter((p) => p.estado === "a_restaurar").length;
  return { total, valor, publicas, aRestaurar, categorias: categorias.length };
}
