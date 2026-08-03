import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, ScanLine, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "documentos";
const A4 = { largura: 595.28, altura: 841.89 };

type Pagina = { id: string; dataUrl: string; largura: number; altura: number };

const botao =
  "inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

/** Lê um ficheiro de imagem, redimensiona para largura máxima e devolve JPEG. */
async function prepararPagina(file: File, contraste: boolean): Promise<Pagina> {
  const bitmap = await createImageBitmap(file);
  const MAX = 1800;
  const escala = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a digitalização.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close?.();

  if (contraste) {
    const img = ctx.getImageData(0, 0, largura, altura);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const cinza = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
      // Realce tipo "documento": clareia o papel e escurece a tinta.
      const v = Math.max(0, Math.min(255, (cinza - 128) * 1.6 + 150));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
  }

  return {
    id: crypto.randomUUID(),
    dataUrl: canvas.toDataURL("image/jpeg", 0.82),
    largura,
    altura,
  };
}

export function DigitalizarDocumento({ pecaId }: { pecaId: string }) {
  const queryClient = useQueryClient();
  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [paginas, setPaginas] = useState<Pagina[]>([]);
  const [contraste, setContraste] = useState(true);
  const [nome, setNome] = useState("");
  const [aProcessar, setAProcessar] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  async function adicionar(files: FileList | null) {
    if (!files?.length) return;
    setAProcessar(true);
    try {
      const novas: Pagina[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        novas.push(await prepararPagina(file, contraste));
      }
      if (!novas.length) {
        toast.error("Selecione imagens das páginas a digitalizar.");
        return;
      }
      setPaginas((atual) => [...atual, ...novas]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar a imagem.");
    } finally {
      setAProcessar(false);
      if (camaraRef.current) camaraRef.current.value = "";
      if (galeriaRef.current) galeriaRef.current.value = "";
    }
  }

  function mover(index: number, delta: number) {
    setPaginas((atual) => {
      const destino = index + delta;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      const [item] = copia.splice(index, 1);
      copia.splice(destino, 0, item!);
      return copia;
    });
  }

  async function guardar() {
    if (!paginas.length) return;
    setAGuardar(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });

      paginas.forEach((pagina, i) => {
        if (i > 0) pdf.addPage();
        const escala = Math.min(A4.largura / pagina.largura, A4.altura / pagina.altura);
        const w = pagina.largura * escala;
        const h = pagina.altura * escala;
        pdf.addImage(
          pagina.dataUrl,
          "JPEG",
          (A4.largura - w) / 2,
          (A4.altura - h) / 2,
          w,
          h,
        );
      });

      const blob = pdf.output("blob");
      const base = (nome.trim() || `Digitalizacao-${new Date().toISOString().slice(0, 10)}`)
        .replace(/\.pdf$/i, "");
      const ficheiro = `${base}.pdf`;
      const path = `${uid}/${pecaId}/${crypto.randomUUID()}.pdf`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase.from("peca_documentos").insert({
        user_id: uid,
        peca_id: pecaId,
        storage_path: path,
        nome: ficheiro,
        tipo: "application/pdf",
        tamanho: blob.size,
        descricao: `Digitalização com ${paginas.length} página(s).`,
      });
      if (dbErr) throw dbErr;

      toast.success("Digitalização guardada como PDF.");
      setPaginas([]);
      setNome("");
      queryClient.invalidateQueries({ queryKey: ["documentos-peca", pecaId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível guardar a digitalização.");
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <div className="mt-5 border border-border p-4">
      <div className="flex items-center gap-2">
        <ScanLine className="size-4 text-accent" aria-hidden />
        <h3 className="text-base">Digitalizar documento</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Fotografe cada página com a câmara ou escolha imagens existentes. As páginas são
        reunidas num único PDF arquivado com a peça.
      </p>

      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void adicionar(e.target.files)}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void adicionar(e.target.files)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={botao}
          disabled={aProcessar || aGuardar}
          onClick={() => camaraRef.current?.click()}
        >
          {aProcessar ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-4" aria-hidden />
          )}
          Digitalizar página
        </button>
        <button
          type="button"
          className={botao}
          disabled={aProcessar || aGuardar}
          onClick={() => galeriaRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden /> Adicionar imagens
        </button>
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={contraste}
            onChange={(e) => setContraste(e.target.checked)}
            className="size-4 accent-[var(--color-accent)]"
          />
          Realce a preto e branco
        </label>
      </div>

      {paginas.length > 0 ? (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {paginas.map((pagina, i) => (
              <li key={pagina.id} className="border border-border p-2">
                <img
                  src={pagina.dataUrl}
                  alt={`Página digitalizada ${i + 1}`}
                  className="h-32 w-full object-cover"
                />
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">Pág. {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="px-1 text-xs text-muted-foreground hover:text-accent"
                      onClick={() => mover(i, -1)}
                      aria-label={`Mover página ${i + 1} para trás`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-1 text-xs text-muted-foreground hover:text-accent"
                      onClick={() => mover(i, 1)}
                      aria-label={`Mover página ${i + 1} para a frente`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="px-1 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setPaginas((atual) => atual.filter((p) => p.id !== pagina.id))
                      }
                      aria-label={`Remover página ${i + 1}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do documento (opcional)"
              className="min-w-52 flex-1 border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            <button type="button" className={botao} disabled={aGuardar} onClick={() => void guardar()}>
              {aGuardar ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ScanLine className="size-4" aria-hidden />
              )}
              {aGuardar ? "A guardar…" : `Guardar PDF (${paginas.length})`}
            </button>
            <button
              type="button"
              className={botao}
              disabled={aGuardar}
              onClick={() => setPaginas([])}
            >
              <X className="size-4" aria-hidden /> Limpar
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
