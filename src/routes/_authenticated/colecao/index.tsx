import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageTitle } from "@/components/AppShell";
import { ApenasEquipa } from "@/components/ApenasEquipa";
import { PecaCard } from "@/components/PecaCard";
import { useAuth } from "@/hooks/useAuth";
import { categoriasQuery, pecasQuery } from "@/lib/queries";


export const Route = createFileRoute("/_authenticated/colecao/")({
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
  return (
    <ApenasEquipa>
      <ColecaoConteudo />
    </ApenasEquipa>
  );
}

function ColecaoConteudo() {
  const { isAdmin } = useAuth();
  const { data: pecas = [], isLoading } = useQuery(pecasQuery());
  const { data: categorias = [] } = useQuery(categoriasQuery());
  const catNome = (id: string | null) => categorias.find((c) => c.id === id)?.nome;

  return (
    <AppShell>
      <PageTitle
        eyebrow={`${pecas.length} peças inventariadas`}
        title="Coleção"
        description="Cada peça tem ficha museológica, histórico de intervenções e controlo de visibilidade."
        action={
          isAdmin ? (
            <Link
              to="/colecao/nova"
              className="border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Nova peça
            </Link>
          ) : null
        }
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar inventário…</p>
      ) : pecas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Inventário vazio.{" "}
          {isAdmin ? (
            <Link to="/colecao/nova" className="text-accent hover:underline">
              Registar a primeira peça
            </Link>
          ) : null}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pecas.map((peca) => (
            <PecaCard key={peca.id} peca={peca} categoria={catNome(peca.categoria_id)} />
          ))}
        </div>
      )}
      <div className="mt-12">
        <ImportarExportar pecas={pecas} categorias={categorias} podeImportar={isAdmin} />
      </div>

    </AppShell>
  );
}

