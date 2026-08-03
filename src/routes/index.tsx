import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PecaCard } from "@/components/PecaCard";
import { atividade, estatisticas, formatEuro, listPecas } from "@/lib/collection";

export const Route = createFileRoute("/")({
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
  component: Painel,
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="plate p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function Painel() {
  const stats = estatisticas();
  const destaques = listPecas().slice(0, 3);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Painel"
        title="A sua coleção, tratada como um museu"
        description="Registo museológico completo, estado de conservação, avaliação e investigação — com histórico de todas as alterações."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Peças inventariadas" value={String(stats.total)} />
        <Metric label="Valor estimado" value={formatEuro(stats.valor)} />
        <Metric label="Visíveis ao público" value={`${stats.publicas} de ${stats.total}`} />
        <Metric label="A aguardar restauro" value={String(stats.aRestaurar)} />
      </div>

      <section className="mt-14">
        <div className="rule-brass mb-6 flex items-end justify-between pb-3">
          <h2 className="text-2xl">Entradas recentes</h2>
          <Link to="/colecao" className="text-sm text-accent hover:underline">
            Ver coleção completa
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {destaques.map((peca) => (
            <PecaCard key={peca.id} peca={peca} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="rule-brass mb-6 pb-3">
          <h2 className="text-2xl">Atividade registada</h2>
        </div>
        <ul className="plate divide-y divide-border">
          {atividade.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4">
              <span className="label-caps w-24">{item.data}</span>
              <span className="text-sm font-medium">{item.accao}</span>
              <span className="text-sm text-muted-foreground">{item.alvo}</span>
              <span className="label-caps ml-auto">{item.autor}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
