import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { listPecasPublicas, type PecaPublica } from "@/lib/public.functions";
import logoAsset from "@/assets/timeless-treasures.webp.asset.json";


export const Route = createFileRoute("/")({
  loader: () => listPecasPublicas(),
  head: () => ({
    meta: [
      { title: "Curadoria — gestão de coleções privadas" },
      {
        name: "description",
        content:
          "Plataforma de curadoria digital para coleções privadas: fichas museológicas, conservação, certificados e investigação.",
      },
      { property: "og:title", content: "Curadoria — gestão de coleções privadas" },
      {
        property: "og:description",
        content: "Fichas museológicas, conservação, certificados e investigação numa só plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <AppShell>
      <p className="text-muted-foreground">Não foi possível carregar as peças públicas.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-muted-foreground">Página não encontrada.</p>
    </AppShell>
  ),
  component: Inicio,
});

function Inicio() {
  const publicas = Route.useLoaderData() as PecaPublica[];
  const { session } = useAuth();

  return (
    <AppShell>
      <PageTitle
        eyebrow="Curadoria digital"
        title="A sua coleção, tratada como um museu"
        description="Ficha museológica por peça, conservação, certificados, dossiês e pesquisa avançada — com auditoria completa e acesso privado."
        action={
          <Link
            to={session ? "/painel" : "/auth"}
            className="border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {session ? "Ir para o painel" : "Entrar na plataforma"}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Inventário museológico", "Autoria, datação, materiais, proveniência, estado e avaliação."],
          ["Conservação e restauro", "Histórico cronológico de intervenções e certificados."],
          ["Investigação", "Pesquisa avançada, dossiês e registo de auditoria de tudo."],
        ].map(([titulo, texto]) => (
          <div key={titulo} className="plate p-6">
            <h2 className="font-display text-2xl">{titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
          </div>
        ))}
      </div>

      <section className="mt-14">
        <div className="rule-brass mb-6 pb-3">
          <h2 className="text-2xl">Peças em exibição pública</h2>
        </div>
        {publicas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma peça está marcada como pública neste momento.
          </p>
        ) : (
          <ul className="plate divide-y divide-border">
            {publicas.map((p) => (
              <li key={p.id}>
                <Link
                  to="/publico/$slug"
                  params={{ slug: p.slug }}
                  className="flex items-center gap-4 px-5 py-4 hover:text-accent"
                >
                  <span className="size-16 shrink-0 overflow-hidden bg-muted">
                    {p.capa ? (
                      p.capa.video ? (
                        <video src={p.capa.url} muted playsInline preload="metadata" className="size-full object-cover" />
                      ) : (
                        <img
                          src={p.capa.url}
                          alt={`Miniatura da peça ${p.titulo}`}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      )
                    ) : null}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-xl">{p.titulo}</span>
                    <span className="text-sm text-muted-foreground">
                      {[p.autor, p.periodo ?? p.datacao].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
