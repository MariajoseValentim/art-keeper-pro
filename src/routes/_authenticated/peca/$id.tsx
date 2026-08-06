import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Trash2 } from "lucide-react";
import { imprimirFicha } from "@/lib/documentos";

import { AppShell, PageTitle } from "@/components/AppShell";
import { ApenasEquipa } from "@/components/ApenasEquipa";
import { useAuth } from "@/hooks/useAuth";
import { PecaForm, type PecaFormValues } from "@/components/PecaForm";
import { MediaPeca } from "@/components/MediaPeca";
import { DocumentosPeca } from "@/components/DocumentosPeca";
import { FichaMuseologica } from "@/components/FichaMuseologica";
import { supabase } from "@/integrations/supabase/client";
import { categoriasQuery, pecaQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/peca/$id")({
  head: () => ({
    meta: [
      { title: "Ficha museológica da peça | Curadoria" },
      {
        name: "description",
        content: "Consulte e edite a ficha museológica: materiais, proveniência, conservação, avaliação e visibilidade.",
      },
      { property: "og:title", content: "Ficha museológica da peça" },
      { property: "og:description", content: "Edição completa da ficha de inventário." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FichaPeca,
});

function FichaPeca() {
  return (
    <ApenasEquipa>
      <FichaPecaConteudo />
    </ApenasEquipa>
  );
}

function FichaPecaConteudo() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: peca, isLoading } = useQuery(pecaQuery(id));
  const { data: categorias = [] } = useQuery(categoriasQuery());
  const [vista, setVista] = useState<"ficha" | "edicao">("ficha");


  const guardar = useMutation({
    mutationFn: async (values: PecaFormValues) => {
      const { error } = await supabase
        .from("pecas")
        .update({
          ...values,
          categoria_id: values.categoria_id || null,
          data_aquisicao: values.data_aquisicao || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pecas"] });
      toast.success("Ficha atualizada.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível guardar."),
  });

  const eliminar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pecas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pecas"] });
      toast.success("Peça eliminada.");
      navigate({ to: "/colecao" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível eliminar."),
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">A carregar ficha…</p>
      </AppShell>
    );
  }

  if (!peca) {
    return (
      <AppShell>
        <h1 className="text-3xl">Peça não encontrada</h1>
        <Link to="/colecao" className="mt-4 inline-block text-accent hover:underline">
          Voltar à coleção
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow={peca.inventario ?? "Ficha museológica"}
        title={peca.titulo}
        description={[peca.autor, peca.periodo].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="no-imprimir flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setVista("ficha");
                setTimeout(
                  () => imprimirFicha(`Ficha museológica — ${peca.titulo}`),
                  150,
                );
              }}
              className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Printer className="size-4" aria-hidden /> Imprimir / PDF
            </button>
            {peca.publico ? (
              <Link
                to="/publico/$slug"
                params={{ slug: peca.slug }}
                className="border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Ver página pública
              </Link>
            ) : null}
            {isAdmin ? (
              <button
                type="button"
                disabled={eliminar.isPending}
                onClick={() => {
                  if (confirm("Eliminar definitivamente esta peça?")) eliminar.mutate();
                }}
                className="inline-flex items-center gap-2 border border-destructive px-5 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden /> Eliminar peça
              </button>
            ) : null}
          </div>
        }
      />
      <div className="no-imprimir mb-8 inline-flex rounded-sm border border-border p-1">
        {(["ficha", "edicao"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`rounded-sm px-4 py-2 text-sm transition-colors duration-200 ${
              vista === v
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "ficha" ? "Ficha museológica" : isAdmin ? "Edição" : "Dados técnicos"}
          </button>
        ))}
      </div>

      {vista === "ficha" ? (
        <div className="area-impressao">
          <FichaMuseologica peca={peca} categorias={categorias} />
        </div>
      ) : (

      <PecaForm
        peca={peca}
        categorias={categorias}
        soLeitura={!isAdmin}
        ocupado={guardar.isPending || eliminar.isPending}
        onSubmit={(values) => guardar.mutate(values)}
        {...(isAdmin
          ? {
              onDelete: () => {
                if (confirm("Eliminar definitivamente esta peça?")) eliminar.mutate();
              },
            }
          : {})}
      />
      )}
      <div className="mt-10">
        <DossieCientifico pecaId={peca.id} titulo={peca.titulo} />
      </div>
      <div className="mt-10">
        <MediaPeca pecaId={peca.id} soLeitura={!isAdmin} />
      </div>
      <div className="mt-10">
        <DocumentosPeca pecaId={peca.id} soLeitura={!isAdmin} />
      </div>

    </AppShell>
  );
}
