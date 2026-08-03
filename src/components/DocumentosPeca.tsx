import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { documentosPecaQuery, type DocumentoPeca } from "@/lib/queries";

const BUCKET = "documentos";
const MAX_MB = 100;

const ACEITES = ".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.csv,.xls,.xlsx,.ods,.ppt,.pptx";

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const botao =
  "inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

export function DocumentosPeca({
  pecaId,
  soLeitura = false,
}: {
  pecaId: string;
  soLeitura?: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const { data: documentos = [], isLoading } = useQuery(documentosPecaQuery(pecaId));

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["documentos-peca", pecaId] });

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    setAEnviar(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      for (const file of Array.from(files)) {
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`"${file.name}" excede ${MAX_MB} MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${uid}/${pecaId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from("peca_documentos").insert({
          user_id: uid,
          peca_id: pecaId,
          storage_path: path,
          nome: file.name,
          tipo: file.type || ext,
          tamanho: file.size,
        });
        if (dbErr) throw dbErr;
      }
      toast.success("Documentos carregados.");
      invalidar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no carregamento.");
    } finally {
      setAEnviar(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function descarregar(doc: DocumentoPeca) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60 * 10, { download: doc.nome });
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível descarregar o documento.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const eliminar = useMutation({
    mutationFn: async (doc: DocumentoPeca) => {
      const { error: sErr } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
      if (sErr) throw sErr;
      const { error } = await supabase.from("peca_documentos").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento removido.");
      invalidar();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível remover."),
  });

  return (
    <section className="plate no-imprimir p-5 sm:p-6">
      <h2 className="text-xl">Documentos da peça</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Arquivo documental anexo: PDFs, relatórios de restauro, certificados, faturas e outros
        ficheiros. Guardados em armazenamento privado e descarregáveis a qualquer momento.
      </p>
      <hr className="gilt-rule my-4" />

      {!soLeitura ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACEITES}
            className="sr-only"
            onChange={(e) => void enviar(e.target.files)}
          />
          <button
            type="button"
            className={botao}
            disabled={aEnviar}
            onClick={() => inputRef.current?.click()}
          >
            {aEnviar ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-4" aria-hidden />
            )}
            {aEnviar ? "A carregar…" : "Carregar documentos"}
          </button>
          <span className="text-xs text-muted-foreground">Até {MAX_MB} MB por ficheiro.</span>
        </div>
      ) : null}

      <div className="mt-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar documentos…</p>
        ) : documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há documentos anexados.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {documentos.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
                <FileText className="size-5 text-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {tamanhoLegivel(doc.tamanho)} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <button
                  type="button"
                  className={botao}
                  onClick={() => void descarregar(doc)}
                  aria-label={`Descarregar ${doc.nome}`}
                >
                  <Download className="size-4" aria-hidden /> Descarregar
                </button>
                {!soLeitura ? (
                  <button
                    type="button"
                    className={botao}
                    disabled={eliminar.isPending}
                    onClick={() => {
                      if (confirm(`Remover "${doc.nome}"?`)) eliminar.mutate(doc);
                    }}
                    aria-label={`Remover ${doc.nome}`}
                  >
                    <Trash2 className="size-4" aria-hidden /> Remover
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
