import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PecaCard } from "@/components/PecaCard";
import { listPecas } from "@/lib/collection";

export const Route = createFileRoute("/colecao/")({
  head: () => ({
    meta: [
      { title: "Coleção — inventário museológico | Curadoria" },
      {
        name: "description",
        content: "Inventário completo da coleção: autoria, período, materiais, estado de conservação e avaliação.",
      },
      { property: "og:title", content: "Coleção — inventário museológico" },
      { property: "og:description", content: "Inventário completo com ficha museológica por peça." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Colecao,
});

function Colecao() {
  const pecas = listPecas();
  return (
    <AppShell>
      <PageTitle
        eyebrow={`${pecas.length} peças inventariadas`}
        title="Coleção"
        description="Cada peça tem ficha museológica, dossiê fotográfico e histórico de intervenções."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pecas.map((peca) => (
          <PecaCard key={peca.id} peca={peca} />
        ))}
      </div>
    </AppShell>
  );
}
