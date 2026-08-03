import { Link } from "@tanstack/react-router";
import type { Peca } from "@/lib/collection";
import { categoriaNome, estadoLabel, formatEuro, raridadeLabel } from "@/lib/collection";

export function PecaCard({ peca }: { peca: Peca }) {
  return (
    <Link
      to="/colecao/$slug"
      params={{ slug: peca.slug }}
      className="plate group flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-plate)]"
    >
      <div className="aspect-4/3 overflow-hidden bg-secondary">
        <img
          src={peca.imagem}
          alt={peca.titulo}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="label-caps">
          {peca.inventario} · {categoriaNome(peca.categoria)}
        </p>
        <h3 className="font-display text-2xl leading-tight">{peca.titulo}</h3>
        <p className="text-sm text-muted-foreground">
          {peca.autor} · {peca.periodo}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs">
          <span className="text-muted-foreground">
            {raridadeLabel[peca.raridade]} · {estadoLabel[peca.estado]}
          </span>
          <span className="font-medium text-accent">{formatEuro(peca.valor)}</span>
        </div>
      </div>
    </Link>
  );
}
