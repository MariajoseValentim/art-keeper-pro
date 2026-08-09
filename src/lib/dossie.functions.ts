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
        properties: {
          rotulo: { type: "string" },
          valor: { type: "string" },
        },
      },
    },
    descricao_historica: {
      type: "string",
    },
    contexto_fabrico: {
      type: "string",
    },
    estado_conservacao: {
      type: "string",
    },
    bibliografia: {
      type: "array",
      items: {
        type: "string",
      },
    },
    cronologia: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["data", "acontecimento"],
        properties: {
          data: { type: "string" },
          acontecimento: { type: "string" },
        },
      },
    },
    avaliacao_raridade: {
      type: "string",
    },
  },
} as const;

export const gerarDossieCientifico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) {
      throw new Error("Peça não indicada.");
    }

    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env["OPENAI_API_KEY"];

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não está configurada.");
    }

    const { data: peca, error } = await context.supabase
      .from("pecas")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!peca) {
      throw new Error("Peça não encontrada.");
    }

    const campos = Object.entries(peca)
      .filter(
        ([chave, valor]) =>
          valor != null &&
          valor !== "" &&
          ![
            "id",
            "user_id",
            "notas_privadas",
            "ficha_tecnica_ficheiros",
          ].includes(chave),
      )
      .map(([chave, valor]) => `${chave}: ${String(valor)}`)
      .join("\n");

    const resposta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        store: false,
        instructions:
          "És um conservador-curador de museu especializado em património, coleções e documentação museológica. " +
          "Redige dossiês científicos rigorosos em português europeu, com linguagem museológica sóbria, clara e profissional. " +
          "Baseia-te exclusivamente nos dados fornecidos para as características específicas da peça. " +
          "Quando fizeres uma inferência histórica geral, identifica-a claramente como hipótese, usando expressões como " +
          "«provavelmente», «é plausível» ou «poderá corresponder». " +
          "Nunca inventes proveniências, fabricantes, datas, certificados, números de inventário, preços ou acontecimentos específicos. " +
          "Não apresentes uma hipótese como facto. " +
          "A bibliografia deve privilegiar referências reais e verificáveis de obras de referência gerais relacionadas com o tipo de objeto, época, materiais ou técnica. " +
          "Se não houver informação suficiente para uma afirmação específica, declara essa limitação.",
        input:
          `Gera o dossiê científico desta peça de coleção.\n\n` +
          `DADOS DA PEÇA:\n${campos}\n\n` +
          `REGRAS:\n` +
          `- Ficha catalográfica: 8 a 16 entradas de rótulo/valor.\n` +
          `- Descrição histórica: 2 a 4 parágrafos.\n` +
          `- Contexto de fabrico: 1 a 3 parágrafos.\n` +
          `- Estado de conservação: avaliação baseada nos dados disponíveis e recomendações prudentes.\n` +
          `- Bibliografia: 4 a 8 referências reais e verificáveis.\n` +
          `- Cronologia: 4 a 8 marcos historicamente coerentes.\n` +
          `- Avaliação de raridade: fundamentada nos dados disponíveis, sem inventar números de produção ou valores de mercado.\n`,
        text: {
          format: {
            type: "json_schema",
            name: "dossie_cientifico",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (resposta.status === 401) {
      throw new Error("A chave da OpenAI é inválida ou não está autorizada.");
    }

    if (resposta.status === 429) {
      throw new Error(
        "Limite de pedidos da OpenAI atingido. Tente novamente daqui a pouco.",
      );
    }

    if (resposta.status === 402) {
      throw new Error(
        "A conta da OpenAI não tem créditos disponíveis para a API.",
      );
    }

    if (!resposta.ok) {
      const detalhe = await resposta.text();

      throw new Error(
        `Falha na OpenAI (${resposta.status}): ${detalhe}`,
      );
    }

    const json = (await resposta.json()) as {
      output?: Array<{
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
    };

    const conteudo = json.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text")
      ?.text;

    if (!conteudo) {
      throw new Error("A OpenAI não devolveu conteúdo.");
    }

    let dossie: DossieCientificoDados;

    try {
      dossie = JSON.parse(conteudo) as DossieCientificoDados;
    } catch {
      throw new Error("A OpenAI devolveu um formato de dossiê inválido.");
    }

    return {
      peca: {
        titulo: peca.titulo,
        inventario: peca.inventario,
        autor: peca.autor,
      },
      dossie,
    };
  });