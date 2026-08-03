import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/AppShell";
import { ApenasEquipa } from "@/components/ApenasEquipa";
import { PecaForm, type PecaFormValues } from "@/components/PecaForm";
import { supabase } from "@/integrations/supabase/client";
import { categoriasQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/colecao/nova")({
  head: () => ({
    meta: [
      { title: "Registar nova peça | Curadoria" },
      {
        name: "description",
        content: "Crie a ficha museológica de uma nova peça: autoria, materiais, proveniência, estado e avaliação.",
      },
      { property: "og:title", content: "Registar nova peça" },
      { property: "og:description", content: "Ficha museológica completa para uma nova aquisição." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovaPeca,
});

function NovaPeca() {
  return (
    <ApenasEquipa soAdmin>
      <NovaPecaConteudo />
    </ApenasEquipa>
  );
}

function NovaPecaConteudo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categorias = [] } = useQuery(categoriasQuery());


  const criar = useMutation({
    mutationFn: async (values: PecaFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const { data, error } = await supabase
        .from("pecas")
        .insert({
          ...values,
          categoria_id: values.categoria_id || null,
          data_aquisicao: values.data_aquisicao || null,
          inventario: values.inventario || null,
          user_id: uid,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pecas"] });
      toast.success("Peça registada.");
      navigate({ to: "/peca/$id", params: { id: data.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível guardar."),
  });

  return (
    <AppShell>
      <PageTitle
        eyebrow="Inventariação"
        title="Nova peça"
        description="Preencha a ficha museológica. Só o título é obrigatório — pode completar os restantes campos mais tarde."
      />
      <PecaForm
        categorias={categorias}
        ocupado={criar.isPending}
        onSubmit={(values) => criar.mutate(values)}
      />
      <section className="plate mt-10 p-5 sm:p-6">
        <h2 className="text-xl">Imagens, vídeos e documentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assim que guardar a peça é aberta a ficha museológica, onde encontra as secções
          «Imagens e vídeos» (fotografias e vídeos com ordenação) e «Documentos da peça»
          (PDFs, certificados e digitalização com a câmara).
        </p>
      </section>

    </AppShell>
  );
}
