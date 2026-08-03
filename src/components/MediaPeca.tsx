import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { midiaQuery, type MidiaItem } from "@/lib/queries";

const BUCKET = "fotografias";
const MAX_MB = 200;

function isVideo(path: string) {
  return /\.(mp4|webm|mov|m4v|ogv|avi|mkv)$/i.test(path);
}

function nomeFicheiro(path: string) {
  return path.split("/").pop() ?? path;
}

export function MediaPeca({ pecaId }: { pecaId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const { data: itens = [], isLoading } = useQuery(midiaQuery(pecaId));

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["midia", pecaId] });

  async function enviar(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAEnviar(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      let proximaOrdem = itens.reduce((m, i) => Math.max(m, i.ordem ?? 0), -1) + 1;
      for (const file of Array.from(files)) {
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`"${file.name}" excede ${MAX_MB} MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${uid}/${pecaId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from("fotografias").insert({
          user_id: uid,
          peca_id: pecaId,
          storage_path: path,
          legenda: file.name,
          ordem: proximaOrdem++,
          principal: itens.length === 0 && !isVideo(path),
        });
        if (dbErr) throw dbErr;
      }
      toast.success("Ficheiros carregados.");
      invalidar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no carregamento.");
    } finally {
      setAEnviar(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const reordenar = useMutation({
    mutationFn: async (novaLista: MidiaItem[]) => {
      const alteradas = novaLista
        .map((item, idx) => ({ item, idx }))
        .filter(({ item, idx }) => item.ordem !== idx);
      for (const { item, idx } of alteradas) {
        const { error } = await supabase
          .from("fotografias")
          .update({ ordem: idx })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onMutate: async (novaLista) => {
      await queryClient.cancelQueries({ queryKey: ["midia", pecaId] });
      const anterior = queryClient.getQueryData<MidiaItem[]>(["midia", pecaId]);
      queryClient.setQueryData<MidiaItem[]>(
        ["midia", pecaId],
        novaLista.map((item, idx) => ({ ...item, ordem: idx })),
      );
      return { anterior };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.anterior) queryClient.setQueryData(["midia", pecaId], ctx.anterior);
      toast.error(e instanceof Error ? e.message : "Não foi possível reordenar.");
    },
    onSettled: () => invalidar(),
  });

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= itens.length) return;
    const lista = [...itens];
    const [movido] = lista.splice(index, 1);
    if (!movido) return;
    lista.splice(destino, 0, movido);
    reordenar.mutate(lista);
  }


  const eliminar = useMutation({
    mutationFn: async (item: MidiaItem) => {
      const { error: sErr } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
      if (sErr) throw sErr;
      const { error } = await supabase.from("fotografias").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ficheiro eliminado.");
      invalidar();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível eliminar."),
  });

  const definirPrincipal = useMutation({
    mutationFn: async (item: MidiaItem) => {
      const { error: r1 } = await supabase
        .from("fotografias")
        .update({ principal: false })
        .eq("peca_id", pecaId);
      if (r1) throw r1;
      const { error } = await supabase
        .from("fotografias")
        .update({ principal: true })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Imagem principal definida.");
      invalidar();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível atualizar."),
  });

  async function descarregar(item: MidiaItem) {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(item.storage_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.legenda || nomeFicheiro(item.storage_path);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível descarregar.");
    }
  }

  return (
    <section className="plate space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Documentação visual</p>
          <h2 className="text-2xl">Imagens e vídeos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ficheiros guardados em armazenamento privado — só a si acessíveis. Máx. {MAX_MB} MB por
            ficheiro.
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            id="upload-midia"
            type="file"
            multiple
            accept="image/*,video/*"
            className="sr-only"
            onChange={(e) => enviar(e.target.files)}
          />
          <Button type="button" disabled={aEnviar} onClick={() => inputRef.current?.click()}>
            {aEnviar ? "A carregar…" : "Carregar ficheiros"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar ficheiros…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há imagens ou vídeos nesta peça.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <li key={item.id} className="border border-border">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                {item.url ? (
                  isVideo(item.storage_path) ? (
                    <video src={item.url} controls className="size-full object-cover" />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.legenda ?? "Documentação da peça"}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )
                ) : null}
              </div>
              <div className="space-y-3 p-4">
                <p className="truncate text-sm" title={item.legenda ?? ""}>
                  {item.legenda ?? nomeFicheiro(item.storage_path)}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    className="text-accent hover:underline"
                    onClick={() => descarregar(item)}
                  >
                    Descarregar
                  </button>
                  {!isVideo(item.storage_path) && !item.principal ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-accent"
                      onClick={() => definirPrincipal.mutate(item)}
                    >
                      Definir como principal
                    </button>
                  ) : null}
                  {item.principal ? <span className="label-caps">Principal</span> : null}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-accent"
                    onClick={() => {
                      if (confirm("Eliminar este ficheiro?")) eliminar.mutate(item);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
