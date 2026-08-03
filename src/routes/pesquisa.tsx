import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { PecaCard } from "@/components/PecaCard";
import { Input } from "@/components/ui/input";
import {
  categorias,
  estadoLabel,
  listPecas,
  raridadeLabel,
  type Estado,
  type Raridade,
} from "@/lib/collection";

export const Route = createFileRoute("/pesquisa")({
  head: () => ({
    meta: [
      { title: "Pesquisa avançada na coleção | Curadoria" },
      {
        name: "description",
        content: "Filtros combináveis por categoria, raridade, estado de conservação e texto livre.",
      },
      { property: "og:title", content: "Pesquisa avançada na coleção" },
      { property: "og:description", content: "Filtros combináveis sobre todo o inventário museológico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pesquisa,
});

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-xs transition-colors ${
        activo
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Pesquisa() {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [raridade, setRaridade] = useState<Raridade | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);

  const resultados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return listPecas().filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (raridade && p.raridade !== raridade) return false;
      if (estado && p.estado !== estado) return false;
      if (!q) return true;
      return [p.titulo, p.autor, p.periodo, p.materiais, p.proveniencia, p.inventario]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [texto, categoria, raridade, estado]);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Investigação"
        title="Pesquisa avançada"
        description="Combine filtros para isolar conjuntos de peças — por classificação, raridade ou estado."
      />

      <div className="plate space-y-5 p-6">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Título, autor, período, materiais, proveniência ou nº de inventário"
          className="h-11"
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps w-24">Categoria</span>
            <Chip activo={categoria === null} onClick={() => setCategoria(null)}>
              Todas
            </Chip>
            {categorias.map((c) => (
              <Chip key={c.id} activo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                {c.nome}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps w-24">Raridade</span>
            <Chip activo={raridade === null} onClick={() => setRaridade(null)}>
              Todas
            </Chip>
            {(Object.keys(raridadeLabel) as Raridade[]).map((r) => (
              <Chip key={r} activo={raridade === r} onClick={() => setRaridade(r)}>
                {raridadeLabel[r]}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps w-24">Estado</span>
            <Chip activo={estado === null} onClick={() => setEstado(null)}>
              Todos
            </Chip>
            {(Object.keys(estadoLabel) as Estado[]).map((e) => (
              <Chip key={e} activo={estado === e} onClick={() => setEstado(e)}>
                {estadoLabel[e]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="label-caps mt-8">{resultados.length} resultados</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resultados.map((peca) => (
          <PecaCard key={peca.id} peca={peca} />
        ))}
      </div>
      {resultados.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhuma peça corresponde a estes filtros.</p>
      ) : null}
    </AppShell>
  );
}
