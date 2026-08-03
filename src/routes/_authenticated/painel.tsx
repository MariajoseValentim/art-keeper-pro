import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PecaCard } from "@/components/PecaCard";
import { formatEuro } from "@/lib/collection";
import { auditoriaQuery, categoriasQuery, pecasQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da coleção | Curadoria" },
      {
        name: "description",
        content: "Estatísticas da coleção, entradas recentes e registo de atividade da sua curadoria digital.",
      },
      { property: "og:title", content: "Painel da coleção" },
      { property: "og:description", content: "Estatísticas, entradas recentes e auditoria." },
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
  return (
    <ApenasEquipa>
      <PainelConteudo />
    </ApenasEquipa>
  );
}

function PainelConteudo() {
  const { data: pecas = [], isLoading } = useQuery(pecasQuery());
  const { data: categorias = [] } = useQuery(categoriasQuery());
  const { data: registos = [] } = useQuery(auditoriaQuery());

  const valor = pecas.reduce((s, p) => s + (p.valor_estimado ?? 0), 0);
  const publicas = pecas.filter((p) => p.publico).length;
  const aRestaurar = pecas.filter((p) => p.estado === "a_restaurar").length;
  const catNome = (id: string | null) => categorias.find((c) => c.id === id)?.nome;

  return (
    <AppShell>
      <PageTitle
        eyebrow="Painel"
        title="A sua coleção, tratada como um museu"
        description="Registo museológico completo, estado de conservação, avaliação e investigação — com histórico de todas as alterações."
        action={
          <Link
            to="/colecao/nova"
            className="border border-accent px-5 py-2.5 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Nova peça
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Peças inventariadas" value={String(pecas.length)} />
        <Metric label="Valor estimado" value={formatEuro(valor)} />
        <Metric label="Visíveis ao público" value={`${publicas} de ${pecas.length}`} />
        <Metric label="A aguardar restauro" value={String(aRestaurar)} />
      </div>

      <section className="mt-14">
        <div className="rule-brass mb-6 flex items-end justify-between pb-3">
          <h2 className="text-2xl">Entradas recentes</h2>
          <Link to="/colecao" className="text-sm text-accent hover:underline">
            Ver coleção completa
          </Link>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar…</p>
        ) : pecas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há peças inventariadas.{" "}
            <Link to="/colecao/nova" className="text-accent hover:underline">
              Registe a primeira.
            </Link>
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {pecas.slice(0, 3).map((peca) => (
              <PecaCard key={peca.id} peca={peca} categoria={catNome(peca.categoria_id)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="rule-brass mb-6 pb-3">
          <h2 className="text-2xl">Atividade registada</h2>
        </div>
        {registos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem registos de auditoria por agora.</p>
        ) : (
          <ul className="plate divide-y divide-border">
            {registos.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4">
                <span className="label-caps w-28">
                  {new Date(item.created_at).toLocaleDateString("pt-PT")}
                </span>
                <span className="text-sm font-medium capitalize">{item.accao}</span>
                <span className="text-sm text-muted-foreground">{item.tabela}</span>
                <span className="label-caps ml-auto">{item.resumo ?? "Auditoria"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
