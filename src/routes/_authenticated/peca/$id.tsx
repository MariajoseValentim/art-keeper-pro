import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PecaForm, type PecaFormValues } from "@/components/PecaForm";
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
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: peca, isLoading } = useQuery(pecaQuery(id));
  const { data: categorias = [] } = useQuery(categoriasQuery());

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
          peca.publico ? (
            <Link
              to="/publico/$slug"
              params={{ slug: peca.slug }}
              className="border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver página pública
            </Link>
          ) : null
        }
      />
      <PecaForm
        peca={peca}
        categorias={categorias}
        ocupado={guardar.isPending || eliminar.isPending}
        onSubmit={(values) => guardar.mutate(values)}
        onDelete={() => {
          if (confirm("Eliminar definitivamente esta peça?")) eliminar.mutate();
        }}
      />
    </AppShell>
  );
}
