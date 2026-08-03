import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getPecaPublica, type MidiaPublica } from "@/lib/public.functions";

export const Route = createFileRoute("/publico/$slug")({
  loader: async ({ params }) => {
    const peca = await getPecaPublica({ data: { slug: params.slug } });
    if (!peca) throw notFound();
    return peca;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.titulo} — ficha museológica | Curadoria` },
          {
            name: "description",
            content:
              `${loaderData.titulo}${loaderData.autor ? `, ${loaderData.autor}` : ""}${
                loaderData.periodo ? `, ${loaderData.periodo}` : ""
              }. ${loaderData.materiais ?? "Peça de coleção privada"}.`.slice(0, 155),
          },
          { property: "og:title", content: `${loaderData.titulo} — ficha museológica` },
          {
            property: "og:description",
            content: [loaderData.autor, loaderData.periodo, loaderData.materiais]
              .filter(Boolean)
              .join(" · "),
          },
          { property: "og:type", content: "article" },
          { name: "twitter:card", content: "summary_large_image" },
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
      <h1 className="text-3xl">Peça não encontrada ou não pública</h1>
      <Link to="/" className="mt-4 inline-block text-accent hover:underline">
        Voltar ao início
      </Link>
    </AppShell>
  ),
  component: PecaPublica,
});

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="border-b border-border py-3">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 text-sm">{valor}</p>
    </div>
  );
}

function PecaPublica() {
  const peca = Route.useLoaderData();
  const midia = peca.midia ?? [];

  return (
    <AppShell>
      <div className="area-impressao">
      <div className="no-imprimir flex justify-end">
        <button
          type="button"
          onClick={() => imprimirFicha(`Ficha museológica — ${peca.titulo}`)}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          <Printer className="size-4" aria-hidden /> Imprimir / PDF
        </button>
      </div>
      <p className="label-caps">Ficha pública</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{peca.titulo}</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {[peca.autor, peca.periodo ?? peca.datacao].filter(Boolean).join(" · ")}
      </p>


      {peca.capa ? (
        <figure className="mt-8 max-w-3xl overflow-hidden bg-muted">
          {peca.capa.video ? (
            <video src={peca.capa.url} controls playsInline className="w-full" />
          ) : (
            <img
              src={peca.capa.url}
              alt={peca.capa.legenda ?? `Fotografia principal da peça ${peca.titulo}`}
              className="w-full object-cover"
            />
          )}
        </figure>
      ) : null}

      {midia.length > 1 ? (
        <ul className="mt-4 grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-5">
          {midia.slice(1).map((m: MidiaPublica) => (
            <li key={m.url} className="aspect-square overflow-hidden bg-muted">
              {m.video ? (
                <video src={m.url} muted playsInline preload="metadata" className="size-full object-cover" />
              ) : (
                <img
                  src={m.url}
                  alt={m.legenda ?? `Documentação da peça ${peca.titulo}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}


      <div className="mt-8 grid max-w-3xl gap-x-8 sm:grid-cols-2">
        <Campo rotulo="Materiais" valor={peca.materiais} />
        <Campo rotulo="Técnica" valor={peca.tecnica} />
        <Campo rotulo="Dimensões" valor={peca.dimensoes} />
        <Campo rotulo="Datação" valor={peca.datacao} />
      </div>

      {peca.descricao ? (
        <div className="mt-8 max-w-3xl">
          <p className="label-caps">Descrição</p>
          <p className="mt-2 text-sm leading-relaxed">{peca.descricao}</p>
        </div>
      ) : null}

      {peca.historico ? (
        <div className="mt-6 max-w-3xl">
          <p className="label-caps">Histórico</p>
          <p className="mt-2 text-sm leading-relaxed">{peca.historico}</p>
        </div>
      ) : null}
      </div>
    </AppShell>

  );
}
