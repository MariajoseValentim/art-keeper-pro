import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/collection";
import { categoriasQuery, pecasQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — classificação da coleção | Curadoria" },
      {
        name: "description",
        content: "Classificação da coleção por categorias: crie, edite e acompanhe quantas peças pertencem a cada uma.",
      },
      { property: "og:title", content: "Categorias — classificação da coleção" },
      { property: "og:description", content: "Estrutura de classificação das peças da coleção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Categorias,
});

function Categorias() {
  const queryClient = useQueryClient();
  const { data: categorias = [] } = useQuery(categoriasQuery());
  const { data: pecas = [] } = useQuery(pecasQuery());
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const criar = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const nomeLimpo = nome.trim();
      if (!nomeLimpo) throw new Error("Indique um nome para a categoria.");
      if (categorias.some((c) => c.nome.trim().toLowerCase() === nomeLimpo.toLowerCase())) {
        throw new Error(`Já existe uma categoria chamada "${nomeLimpo}".`);
      }
      const base = slugify(nomeLimpo) || crypto.randomUUID();
      const usados = new Set(categorias.map((c) => c.slug));
      let slug = base;
      let i = 2;
      while (usados.has(slug)) slug = `${base}-${i++}`;
      const { error } = await supabase.from("categorias").insert({
        nome: nomeLimpo,
        slug,
        descricao: descricao.trim() || null,
        user_id: uid,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Já existe uma categoria com esse nome.");
        throw error;
      }
    },
    onSuccess: () => {
      setNome("");
      setDescricao("");
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível criar."),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria eliminada.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível eliminar."),
  });

  return (
    <AppShell>
      <PageTitle
        eyebrow="Classificação"
        title="Categorias"
        description="Estrutura de classificação usada em toda a plataforma — fichas, dossiês e pesquisa avançada."
      />

      <form
        className="plate mb-10 grid gap-4 p-6 md:grid-cols-[1fr_1.4fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          criar.mutate();
        }}
      >
        <div className="space-y-2">
          <label htmlFor="nome" className="label-caps">
            Nome
          </label>
          <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="descricao" className="label-caps">
            Descrição
          </label>
          <Input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Óleo, têmpera e técnicas mistas…"
          />
        </div>
        <Button type="submit" disabled={criar.isPending}>
          Adicionar
        </Button>
      </form>

      {categorias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não criou categorias.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categorias.map((c) => {
            const total = pecas.filter((p) => p.categoria_id === c.id).length;
            return (
              <div key={c.id} className="plate p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl">{c.nome}</h2>
                  <span className="label-caps">{total} peças</span>
                </div>
                {c.descricao ? (
                  <p className="mt-2 text-sm text-muted-foreground">{c.descricao}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Eliminar a categoria "${c.nome}"?`)) eliminar.mutate(c.id);
                  }}
                  className="mt-4 text-xs text-muted-foreground hover:text-accent"
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
