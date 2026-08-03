import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  autenticidadeLabel,
  categoriaNome,
  estadoLabel,
  formatEuro,
  getPeca,
  raridadeLabel,
} from "@/lib/collection";

export const Route = createFileRoute("/colecao/$slug")({
  loader: ({ params }) => {
    const peca = getPeca(params.slug);
    if (!peca) throw notFound();
    return peca;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.titulo} — ficha museológica | Curadoria` },
          {
            name: "description",
            content: `${loaderData.titulo}, ${loaderData.autor}, ${loaderData.periodo}. ${loaderData.materiais}, ${loaderData.dimensoes}.`,
          },
          { property: "og:title", content: `${loaderData.titulo} — ficha museológica` },
          {
            property: "og:description",
            content: `${loaderData.autor} · ${loaderData.periodo} · ${loaderData.materiais}`,
          },
          { property: "og:type", content: "article" },
          { property: "og:image", content: loaderData.imagem },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:image", content: loaderData.imagem },
        ]
      : [],
  }),
  errorComponent: () => (
    <AppShell>
      <p className="text-muted-foreground">Não foi possível carregar esta ficha.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <h1 className="text-3xl">Peça não encontrada</h1>
      <Link to="/colecao" className="mt-4 inline-block text-accent hover:underline">
        Voltar à coleção
      </Link>
    </AppShell>
  ),
  component: FichaPeca,
});

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="border-b border-border py-3">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 text-sm">{valor}</p>
    </div>
  );
}

function FichaPeca() {
  const peca = Route.useLoaderData();

  return (
    <AppShell>
      <Link to="/colecao" className="label-caps hover:text-accent">
        ← Coleção
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="plate overflow-hidden">
          <img src={peca.imagem} alt={peca.titulo} className="aspect-4/5 w-full object-cover" />
        </div>

        <div>
          <p className="label-caps">
            {peca.inventario} · {categoriaNome(peca.categoria)}
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl">{peca.titulo}</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {peca.autor} · {peca.periodo}
          </p>

          <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
            <Campo rotulo="Materiais e técnica" valor={peca.materiais} />
            <Campo rotulo="Dimensões" valor={peca.dimensoes} />
            <Campo rotulo="Estado de conservação" valor={estadoLabel[peca.estado]} />
            <Campo rotulo="Raridade" valor={raridadeLabel[peca.raridade]} />
            <Campo rotulo="Autenticidade" valor={autenticidadeLabel[peca.autenticidade]} />
            <Campo rotulo="Avaliação" valor={formatEuro(peca.valor)} />
            <Campo rotulo="Data de aquisição" valor={peca.aquisicao} />
            <Campo rotulo="Visibilidade" valor={peca.publica ? "Pública (via slug)" : "Privada"} />
          </div>

          <div className="mt-8">
            <p className="label-caps">Proveniência</p>
            <p className="mt-2 text-sm leading-relaxed">{peca.proveniencia}</p>
          </div>

          <div className="mt-6">
            <p className="label-caps">Notas de conservação</p>
            <p className="mt-2 text-sm leading-relaxed">{peca.notas}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
