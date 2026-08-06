import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface DossieCientificoDados {
  ficha_catalografica: { rotulo: string; valor: string }[];
  descricao_historica: string;
  contexto_fabrico: string;
  estado_conservacao: string;
  bibliografia: string[];
  cronologia: { data: string; acontecimento: string }[];
  avaliacao_raridade: string;
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "ficha_catalografica",
    "descricao_historica",
    "contexto_fabrico",
    "estado_conservacao",
    "bibliografia",
    "cronologia",
    "avaliacao_raridade",
  ],
  properties: {
    ficha_catalografica: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rotulo", "valor"],
        properties: { rotulo: { type: "string" }, valor: { type: "string" } },
      },
    },
    descricao_historica: { type: "string" },
    contexto_fabrico: { type: "string" },
    estado_conservacao: { type: "string" },
    bibliografia: { type: "array", items: { type: "string" } },
    cronologia: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["data", "acontecimento"],
        properties: { data: { type: "string" }, acontecimento: { type: "string" } },
      },
    },
    avaliacao_raridade: { type: "string" },
  },
} as const;

export const gerarDossieCientifico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Peça não indicada.");
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de IA indisponível.");

    const { data: peca, error } = await context.supabase
      .from("pecas")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!peca) throw new Error("Peça não encontrada.");

    const campos = Object.entries(peca)
      .filter(
        ([chave, valor]) =>
          valor != null &&
          valor !== "" &&
          !["id", "user_id", "notas_privadas", "ficha_tecnica_ficheiros"].includes(chave),
      )
      .map(([chave, valor]) => `${chave}: ${String(valor)}`)
      .join("\n");

    const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "És um conservador-curador de museu. Redige dossiês científicos rigorosos em português europeu, com linguagem museológica sóbria. Baseia-te nos dados fornecidos; quando inferires contexto histórico geral, indica-o como hipótese («provavelmente», «é plausível»). Nunca inventes proveniências, certificados ou preços. A bibliografia deve conter referências reais e verificáveis de obras de referência gerais sobre o tipo de objeto, época ou técnica.",
          },
          {
            role: "user",
            content: `Gera o dossiê científico desta peça de coleção.\n\nDADOS DA PEÇA:\n${campos}\n\nRegras: ficha catalográfica com 8 a 16 entradas rótulo/valor; descrição histórica com 2 a 4 parágrafos; contexto de fabrico com 1 a 3 parágrafos; estado de conservação com recomendações; bibliografia com 4 a 8 referências; cronologia com 4 a 8 marcos; avaliação de raridade fundamentada.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "dossie_cientifico", strict: true, schema },
        },
      }),
    });

    if (resposta.status === 429) throw new Error("Limite de pedidos atingido. Tente novamente daqui a pouco.");
    if (resposta.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!resposta.ok) throw new Error(`Falha na geração (${resposta.status}): ${await resposta.text()}`);

    const json = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const conteudo = json.choices?.[0]?.message?.content;
    if (!conteudo) throw new Error("A IA não devolveu conteúdo.");

    return {
      peca: { titulo: peca.titulo, inventario: peca.inventario, autor: peca.autor },
      dossie: JSON.parse(conteudo) as DossieCientificoDados,
    };
  });
