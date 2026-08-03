import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify, type CategoriaRow, type PecaRow } from "@/lib/collection";
import {
  COLUNAS_PECA,
  descarregar,
  lerCSV,
  nomeFicheiro,
  normalizarPeca,
  paraCSV,
  type PecaImportada,
} from "@/lib/documentos";

const botao =
  "inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

export function ImportarExportar({
  pecas,
  categorias,
  podeImportar,
}: {
  pecas: PecaRow[];
  categorias: CategoriaRow[];
  podeImportar: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aImportar, setAImportar] = useState(false);

  const nomeCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "";

  const linhas = () =>
    pecas.map((p) => ({
      ...p,
      categoria: nomeCategoria(p.categoria_id),
    })) as unknown as Record<string, unknown>[];

  const exportarCSV = () => {
    descarregar(nomeFicheiro("colecao", "csv"), paraCSV(linhas(), COLUNAS_PECA), "text/csv");
    toast.success(`${pecas.length} peças exportadas em CSV.`);
  };

  const exportarJSON = () => {
    descarregar(
      nomeFicheiro("colecao", "json"),
      JSON.stringify(linhas(), null, 2),
      "application/json",
    );
    toast.success(`${pecas.length} peças exportadas em JSON.`);
  };

  const importar = async (ficheiro: File) => {
    setAImportar(true);
    try {
      const texto = await ficheiro.text();
      const registos = ficheiro.name.toLowerCase().endsWith(".json")
        ? (JSON.parse(texto) as Record<string, string>[])
        : lerCSV(texto);

      const { data: sessao } = await supabase.auth.getUser();
      const userId = sessao.user?.id;
      if (!userId) throw new Error("Sessão expirada.");

      const catPorNome = new Map(categorias.map((c) => [c.nome.toLowerCase(), c.id]));
      const slugsExistentes = new Map(pecas.map((p) => [p.slug, p.id]));
      const usados = new Set(pecas.map((p) => p.slug));

      const novas: PecaImportada[] = [];
      const atualizar: { id: string; valores: PecaImportada }[] = [];
      let ignoradas = 0;

      for (const registo of registos) {
        const normalizada = normalizarPeca(
          Object.fromEntries(
            Object.entries(registo).map(([k, v]) => [
              k.trim().toLowerCase().replace(/\s+/g, "_"),
              v == null ? "" : String(v),
            ]),
          ),
        );
        if (!normalizada) {
          ignoradas++;
          continue;
        }

        const categoriaNome = String(normalizada["categoria"] ?? "").toLowerCase();
        delete normalizada["categoria"];
        if (categoriaNome && catPorNome.has(categoriaNome)) {
          normalizada["categoria_id"] = catPorNome.get(categoriaNome) ?? null;
        }

        const slugBase = String(normalizada["slug"] || slugify(String(normalizada["titulo"])));
        const existente = slugsExistentes.get(slugBase);
        if (existente) {
          normalizada["slug"] = slugBase;
          atualizar.push({ id: existente, valores: normalizada });
          continue;
        }
        let slug = slugBase || slugify(String(normalizada["titulo"]));
        let n = 2;
        while (usados.has(slug)) slug = `${slugBase}-${n++}`;
        usados.add(slug);
        normalizada["slug"] = slug;
        normalizada["user_id"] = userId;
        novas.push(normalizada);
      }

      if (novas.length) {
        const { error } = await supabase.from("pecas").insert(novas as never);
        if (error) throw error;
      }
      for (const item of atualizar) {
        const { error } = await supabase
          .from("pecas")
          .update(item.valores as never)
          .eq("id", item.id);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["pecas"] });
      toast.success(
        `Importação concluída: ${novas.length} novas, ${atualizar.length} atualizadas` +
          (ignoradas ? `, ${ignoradas} ignoradas (sem título)` : "") +
          ".",
      );
    } catch (erro) {
      toast.error(
        erro instanceof Error ? `Falha na importação: ${erro.message}` : "Falha na importação.",
      );
    } finally {
      setAImportar(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="plate no-imprimir p-5 sm:p-6">
      <h2 className="text-xl">Documentos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Exporte o inventário para folha de cálculo ou arquivo, e importe registos a partir de CSV ou
        JSON. As colunas seguem os campos da ficha museológica.
      </p>
      <hr className="gilt-rule my-4" />
      <div className="flex flex-wrap gap-3">
        <button type="button" className={botao} onClick={exportarCSV} disabled={!pecas.length}>
          <Download className="size-4" aria-hidden /> Exportar CSV
        </button>
        <button type="button" className={botao} onClick={exportarJSON} disabled={!pecas.length}>
          <Download className="size-4" aria-hidden /> Exportar JSON
        </button>
        <button
          type="button"
          className={botao}
          onClick={() =>
            descarregar(
              "modelo-importacao.csv",
              paraCSV([], COLUNAS_PECA),
              "text/csv",
            )
          }
        >
          <Download className="size-4" aria-hidden /> Modelo de importação
        </button>
        {podeImportar ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importar(f);
              }}
            />
            <button
              type="button"
              className={botao}
              disabled={aImportar}
              onClick={() => inputRef.current?.click()}
            >
              {aImportar ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileUp className="size-4" aria-hidden />
              )}
              {aImportar ? "A importar…" : "Importar CSV / JSON"}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
