import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LayoutGrid, Library, Tags, Search, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/painel", label: "Painel", icon: LayoutGrid },
  { to: "/colecao", label: "Coleção", icon: Library },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/pesquisa", label: "Pesquisa", icon: Search },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="rule-brass sticky top-0 z-30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none tracking-tight">Curadoria</span>
            <span className="label-caps hidden sm:inline">Coleção privada</span>
          </Link>
          <nav className="flex items-center gap-1">
            {session
              ? nav.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    activeProps={{ className: "text-accent border-accent" }}
                    inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                    className="flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="hidden md:inline">{label}</span>
                  </Link>
                ))
              : null}
            {loading ? null : session ? (
              <button
                type="button"
                onClick={sair}
                className="ml-2 flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="border border-accent px-4 py-2 text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Entrar
              </Link>
            )}
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
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="label-caps">{eyebrow}</p>
        <h1 className="mt-2 text-4xl md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
