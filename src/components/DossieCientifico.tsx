import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Printer, Sparkles } from "lucide-react";
import { gerarDossieCientifico, type DossieCientificoDados } from "@/lib/dossie.functions";
import { imprimirFicha } from "@/lib/documentos";

const botao =
  "inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="plate p-5 sm:p-6">
      <h3 className="text-lg">{titulo}</h3>
      <hr className="gilt-rule my-4" />
      {children}
    </section>
  );
}

function Paragrafos({ texto }: { texto: string }) {
  return <p className="text-sm whitespace-pre-line text-foreground">{texto}</p>;
}

export function DossieCientifico({ pecaId, titulo }: { pecaId: string; titulo: string }) {
  const gerar = useServerFn(gerarDossieCientifico);
  const [ocupado, setOcupado] = useState(false);
  const [dossie, setDossie] = useState<DossieCientificoDados | null>(null);

  const executar = async () => {
    setOcupado(true);
    try {
      const resultado = await gerar({ data: { id: pecaId } });
      setDossie(resultado.dossie);
      toast.success("Dossiê científico gerado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível gerar o dossiê.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section>
      <div className="no-imprimir plate p-5 sm:p-6">
        <h2 className="text-xl">Dossiê científico automático</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A partir dos dados da peça, a IA compõe a ficha catalográfica, descrição histórica,
          contexto de fabrico, estado de conservação, bibliografia, cronologia e avaliação de
          raridade. Pode depois exportar tudo em PDF.
        </p>
        <hr className="gilt-rule my-4" />
        <div className="flex flex-wrap gap-3">
          <button type="button" className={botao} disabled={ocupado} onClick={() => void executar()}>
            {ocupado ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {ocupado ? "A redigir dossiê…" : dossie ? "Gerar novamente" : "Gerar dossiê científico"}
          </button>
          {dossie ? (
            <button
              type="button"
              className={botao}
              onClick={() => imprimirFicha(`Dossiê científico — ${titulo}`)}
            >
              <Printer className="size-4" aria-hidden /> Exportar PDF
            </button>
          ) : null}
        </div>
      </div>

      {dossie ? (
        <div className="area-impressao mt-6 space-y-6">
          <h2 className="text-2xl">Dossiê científico — {titulo}</h2>

          <Seccao titulo="Ficha catalográfica">
            <dl>
              {dossie.ficha_catalografica.map((linha, i) => (
                <div key={i} className="border-b border-border/60 py-3 last:border-b-0">
                  <dt className="label-caps">{linha.rotulo}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-line text-foreground">{linha.valor}</dd>
                </div>
              ))}
            </dl>
          </Seccao>

          <Seccao titulo="Descrição histórica">
            <Paragrafos texto={dossie.descricao_historica} />
          </Seccao>

          <Seccao titulo="Contexto de fabrico">
            <Paragrafos texto={dossie.contexto_fabrico} />
          </Seccao>

          <Seccao titulo="Estado de conservação">
            <Paragrafos texto={dossie.estado_conservacao} />
          </Seccao>

          <Seccao titulo="Cronologia">
            <ol className="space-y-3">
              {dossie.cronologia.map((marco, i) => (
                <li key={i} className="border-b border-border/60 pb-3 last:border-b-0">
                  <span className="label-caps">{marco.data}</span>
                  <p className="mt-1 text-sm text-foreground">{marco.acontecimento}</p>
                </li>
              ))}
            </ol>
          </Seccao>

          <Seccao titulo="Avaliação de raridade">
            <Paragrafos texto={dossie.avaliacao_raridade} />
          </Seccao>

          <Seccao titulo="Bibliografia">
            <ul className="space-y-2">
              {dossie.bibliografia.map((ref, i) => (
                <li key={i} className="text-sm text-foreground">
                  {ref}
                </li>
              ))}
            </ul>
          </Seccao>

          <p className="text-xs text-muted-foreground">
            Documento gerado automaticamente por IA a partir do inventário. Deve ser revisto por
            um conservador antes de uso institucional.
          </p>
        </div>
      ) : null}
    </section>
  );
}
