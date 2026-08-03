import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LayoutGrid, Library, Tags, Search, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BotaoTema } from "@/components/BotaoTema";

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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-baseline gap-3">
            <span className="truncate font-display text-xl leading-none tracking-tight sm:text-2xl">
              Timeless Treasures
            </span>
            <span className="label-caps hidden lg:inline">Curadoria de coleções</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <nav className="hidden items-center gap-1 sm:flex">
              {session
                ? nav.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      activeProps={{ className: "text-accent border-accent" }}
                      inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                      className="flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors duration-200 hover:text-foreground"
                    >
                      <Icon className="size-4" aria-hidden />
                      <span className="hidden md:inline">{label}</span>
                    </Link>
                  ))
                : null}
            </nav>
            <BotaoTema className="ml-1" />
            {loading ? null : session ? (
              <button
                type="button"
                onClick={sair}
                className="ml-1 flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden md:inline">Sair</span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="ml-1 rounded-sm border border-accent px-4 py-2 text-sm text-accent transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>

      {session ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
          <div className="grid grid-cols-4">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "text-accent" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[0.65rem] transition-colors duration-200"
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <hr className="gilt-rule mb-6" />
        <p className="label-caps">
          Timeless Treasures · Old things are never out of style
        </p>
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
    <div className="fade-up mb-8 sm:mb-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="label-caps">{eyebrow}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <hr className="gilt-rule mt-6" />
    </div>
  );
}
