import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { PecaRow } from "@/lib/collection";
import { estadoLabel, formatEuro, label, raridadeLabel } from "@/lib/collection";
import { capasQuery } from "@/lib/queries";

export function PecaCard({
  peca,
  categoria,
}: {
  peca: PecaRow;
  categoria?: string | undefined;
}) {
  const { data: capas } = useQuery(capasQuery());
  const capa = capas?.[peca.id];

  return (
    <Link
      to="/peca/$id"
      params={{ id: peca.id }}
      className="plate group flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-plate)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {capa ? (
          capa.video ? (
            <video
              src={capa.url}
              muted
              playsInline
              preload="metadata"
              className="size-full object-cover"
            />
          ) : (
            <img
              src={capa.url}
              alt={`Fotografia da peça ${peca.titulo}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="label-caps text-muted-foreground">Sem imagem</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="label-caps">
          {peca.inventario ?? "Sem inventário"}
          {categoria ? ` · ${categoria}` : ""}
        </p>
        <h3 className="mt-2 font-display text-2xl leading-tight">{peca.titulo}</h3>
        <p className="text-sm text-muted-foreground">
          {[peca.autor, peca.periodo ?? peca.datacao].filter(Boolean).join(" · ") ||
            "Autoria por apurar"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-6 text-xs">
          <span className="text-muted-foreground">
            {label(raridadeLabel, peca.raridade)} · {label(estadoLabel, peca.estado)}
          </span>
          <span className="font-medium text-accent">
            {formatEuro(peca.valor_estimado, peca.moeda)}
          </span>
        </div>
      </div>
    </Link>
  );
}
