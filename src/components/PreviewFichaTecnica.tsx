import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export async function abrirDocumento(path: string) {
  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    toast.error("Não foi possível abrir o documento.");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
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

const previewQuery = (path: string, pdf: boolean) => ({
  queryKey: ["ficha-tecnica-preview", path],
  queryFn: async (): Promise<{ url: string | null; paginas: string[] }> => {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(path, 60 * 60);
    if (error) throw error;
    const url = data?.signedUrl ?? null;
    if (!url || !pdf) return { url, paginas: [] };
    try {
      return { url, paginas: await miniaturasPdf(url) };
    } catch {
      return { url, paginas: [] };
    }
  },
  staleTime: 50 * 60 * 1000,
});

export function PreviewFichaTecnica({ path, nome }: { path: string; nome: string | null }) {
  const pdf = /\.pdf$/i.test(path);
  const { data, isLoading } = useQuery(previewQuery(path, pdf));
  const rotulo = nome ?? "Documento da ficha técnica";
  const paginas = data?.paginas ?? [];

  return (
    <div className="mt-4 space-y-3">
      {pdf && isLoading ? (
        <div className="frame-art flex h-40 items-center justify-center gap-2 rounded-lg">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
          <span className="label-caps">A preparar miniaturas…</span>
        </div>
      ) : null}

      {paginas.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {paginas.map((src, i) => (
            <li key={src.slice(-24) + i}>
              <button
                type="button"
                onClick={() => void abrirDocumento(path)}
                aria-label={`Abrir documento na página ${i + 1}`}
                className="frame-art block w-full overflow-hidden rounded-sm transition-opacity duration-200 hover:opacity-100 focus:opacity-100 opacity-90"
              >
                <img
                  src={src}
                  alt={`Página ${i + 1} da ficha técnica`}
                  loading="lazy"
                  className="w-full bg-background object-contain"
                />
                <span className="block border-t border-border py-1 text-center text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                  Página {i + 1}
                </span>
              </button>
            </li>
          ))}
        </ul>
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
