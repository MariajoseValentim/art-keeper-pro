import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export async function abrirDocumento(path: string, pagina?: number) {
  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    toast.error("Não foi possível abrir o documento.");
    return;
  }
  const pdf = /\.pdf$/i.test(path);
  const alvo =
    pdf && pagina && pagina > 1
      ? `${data.signedUrl}#page=${pagina}&view=FitH`
      : pdf
        ? `${data.signedUrl}#view=FitH`
        : data.signedUrl;
  window.open(alvo, "_blank", "noopener");
}

async function miniaturasPdf(url: string): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const resposta = await fetch(url);
  const dados = new Uint8Array(await resposta.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: dados }).promise;
  const paginas: string[] = [];
  const total = Math.min(doc.numPages, 30);
  for (let i = 1; i <= total; i++) {
    const pagina = await doc.getPage(i);
    const base = pagina.getViewport({ scale: 1 });
    const escala = 420 / base.width;
    const viewport = pagina.getViewport({ scale: escala });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await pagina.render({ canvas, canvasContext: ctx, viewport }).promise;
    paginas.push(canvas.toDataURL("image/jpeg", 0.75));
  }
  return paginas;
}

type Tipo = "pdf" | "word" | "texto" | "outro";

function tipoDe(path: string): Tipo {
  if (/\.pdf$/i.test(path)) return "pdf";
  if (/\.docx?$/i.test(path)) return "word";
  if (/\.(txt|md|csv|rtf)$/i.test(path)) return "texto";
  return "outro";
}

async function htmlWord(url: string): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const resposta = await fetch(url);
  const arrayBuffer = await resposta.arrayBuffer();
  const { value } = await mammoth.convertToHtml({ arrayBuffer });
  return value;
}

const previewQuery = (path: string, tipo: Tipo) => ({
  queryKey: ["ficha-tecnica-preview", path],
  queryFn: async (): Promise<{ url: string | null; paginas: string[]; html: string | null; texto: string | null }> => {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(path, 60 * 60);
    if (error) throw error;
    const url = data?.signedUrl ?? null;
    const vazio = { url, paginas: [] as string[], html: null, texto: null };
    if (!url) return vazio;
    try {
      if (tipo === "pdf") return { ...vazio, paginas: await miniaturasPdf(url) };
      if (tipo === "word") return { ...vazio, html: await htmlWord(url) };
      if (tipo === "texto") return { ...vazio, texto: await (await fetch(url)).text() };
    } catch {
      return vazio;
    }
    return vazio;
  },
  staleTime: 50 * 60 * 1000,
});

export function PreviewFichaTecnica({ path, nome }: { path: string; nome: string | null }) {
  const tipo = tipoDe(path);
  const pdf = tipo === "pdf";
  const { data, isLoading } = useQuery(previewQuery(path, tipo));
  const rotulo = nome ?? "Documento da ficha técnica";
  const paginas = data?.paginas ?? [];
  const html = data?.html ?? null;
  const texto = data?.texto ?? null;
  const total = paginas.length;
  const [atual, setAtual] = useState(1);
  const [salto, setSalto] = useState("");
  const refs = useRef<Record<number, HTMLLIElement | null>>({});

  useEffect(() => {
    if (total && atual > total) setAtual(1);
  }, [total, atual]);

  function irPara(n: number) {
    if (!total) return;
    const destino = Math.min(Math.max(n, 1), total);
    setAtual(destino);
    refs.current[destino]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className="mt-4 space-y-3">
      {isLoading && tipo !== "outro" ? (
        <div className="frame-art flex h-40 items-center justify-center gap-2 rounded-lg">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
          <span className="label-caps">A preparar pré-visualização…</span>
        </div>
      ) : null}

      {html ? (
        <div
          className="doc-preview frame-art max-h-[32rem] overflow-auto rounded-lg bg-background p-5 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      {texto ? (
        <pre className="frame-art max-h-[32rem] overflow-auto rounded-lg bg-background p-5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {texto}
        </pre>
      ) : null}


      {total ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border border-border px-3 py-2">
            <button
              type="button"
              onClick={() => irPara(atual - 1)}
              disabled={atual <= 1}
              aria-label="Página anterior"
              className="inline-flex size-8 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span aria-live="polite" className="label-caps">
              Página {atual} de {total}
            </span>
            <button
              type="button"
              onClick={() => irPara(atual + 1)}
              disabled={atual >= total}
              aria-label="Página seguinte"
              className="inline-flex size-8 items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <form
              className="ml-auto flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(salto);
                if (Number.isFinite(n) && n >= 1) irPara(Math.trunc(n));
                setSalto("");
              }}
            >
              <label htmlFor="salto-pagina" className="label-caps">
                Ir para
              </label>
              <input
                id="salto-pagina"
                type="number"
                min={1}
                max={total}
                value={salto}
                onChange={(e) => setSalto(e.target.value)}
                placeholder={String(atual)}
                className="w-16 border border-border bg-transparent px-2 py-1 text-sm text-foreground"
              />
              <button
                type="submit"
                className="border border-border px-3 py-1 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Saltar
              </button>
            </form>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {paginas.map((src, i) => {
              const n = i + 1;
              return (
                <li
                  key={src.slice(-24) + i}
                  ref={(el) => {
                    refs.current[n] = el;
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAtual(n);
                      void abrirDocumento(path, n);
                    }}
                    aria-label={`Abrir documento na página ${n}`}
                    title={pdf ? `Abrir na página ${n}` : "Abrir documento"}
                    aria-current={n === atual}
                    className={`frame-art block w-full overflow-hidden rounded-sm transition-all duration-200 hover:opacity-100 ${
                      n === atual ? "border-accent opacity-100" : "opacity-70"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Página ${n} da ficha técnica`}
                      loading="lazy"
                      className="w-full bg-background object-contain"
                    />
                    <span className="block border-t border-border py-1 text-center text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                      Página {n}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}


      {!isLoading && !paginas.length ? (
        <p className="text-sm text-muted-foreground">
          {pdf
            ? "Não foi possível gerar as miniaturas deste PDF — abra o ficheiro para consultar."
            : "Pré-visualização por páginas disponível apenas em PDF — abra o ficheiro Word para consultar."}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void abrirDocumento(path)}
        className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
      >
        <FileText className="size-4" aria-hidden />
        {rotulo}
      </button>
    </div>
  );
}
