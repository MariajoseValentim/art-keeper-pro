import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { categorias, listPecas } from "@/lib/collection";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — classificação da coleção | Curadoria" },
      {
        name: "description",
        content: "Classificação hierárquica das peças: pintura, escultura, cerâmica, mobiliário e documentação.",
      },
      { property: "og:title", content: "Categorias — classificação da coleção" },
      { property: "og:description", content: "Classificação hierárquica das peças da coleção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Categorias,
});

function Categorias() {
  const pecas = listPecas();
  return (
    <AppShell>
      <PageTitle
        eyebrow="Classificação"
        title="Categorias"
        description="Estrutura de classificação usada em toda a plataforma — fichas, dossiês e pesquisa avançada."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {categorias.map((c) => {
          const total = pecas.filter((p) => p.categoria === c.id).length;
          return (
            <div key={c.id} className="plate p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl">{c.nome}</h2>
                <span className="label-caps">{total} peças</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.descricao}</p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
