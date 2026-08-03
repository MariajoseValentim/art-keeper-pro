import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, Library, Tags, Search } from "lucide-react";

const nav = [
  { to: "/", label: "Painel", icon: LayoutGrid },
  { to: "/colecao", label: "Coleção", icon: Library },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/pesquisa", label: "Pesquisa", icon: Search },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="rule-brass sticky top-0 z-30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none tracking-tight">Curadoria</span>
            <span className="label-caps hidden sm:inline">Coleção privada</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-accent border-accent" }}
                inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                className="flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="rule-brass mx-auto mt-16 max-w-6xl border-b-0 border-t px-6 py-8">
        <p className="label-caps">Curadoria digital · registo, conservação e investigação</p>
      </footer>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="label-caps">{eyebrow}</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{title}</h1>
      {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
