import { Link } from "@tanstack/react-router";
import type { PecaRow } from "@/lib/collection";
import { estadoLabel, formatEuro, label, raridadeLabel } from "@/lib/collection";

export function PecaCard({ peca, categoria }: { peca: PecaRow; categoria?: string }) {
  return (
    <Link
      to="/peca/$id"
      params={{ id: peca.id }}
      className="plate group flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-plate)]"
    >
      <p className="label-caps">
        {peca.inventario ?? "Sem inventário"}
        {categoria ? ` · ${categoria}` : ""}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-tight">{peca.titulo}</h3>
      <p className="text-sm text-muted-foreground">
        {[peca.autor, peca.periodo ?? peca.datacao].filter(Boolean).join(" · ") || "Autoria por apurar"}
      </p>
      <div className="mt-auto flex items-center justify-between pt-6 text-xs">
        <span className="text-muted-foreground">
          {label(raridadeLabel, peca.raridade)} · {label(estadoLabel, peca.estado)}
        </span>
        <span className="font-medium text-accent">{formatEuro(peca.valor_estimado, peca.moeda)}</span>
      </div>
    </Link>
  );
}
