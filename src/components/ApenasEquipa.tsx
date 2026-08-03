import type { ReactNode } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

/** Bloqueia o conteúdo a quem não tem perfil de curador ou administrador. */
export function ApenasEquipa({
  children,
  soAdmin = false,
}: {
  children: ReactNode;
  soAdmin?: boolean;
}) {
  const { perfisCarregados, isAdmin, podeConsultar } = useAuth();

  if (!perfisCarregados) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">A verificar permissões…</p>
      </AppShell>
    );
  }

  const autorizado = soAdmin ? isAdmin : podeConsultar;
  if (autorizado) return <>{children}</>;

  return (
    <AppShell>
      <PageTitle
        eyebrow="Acesso restrito"
        title="Sem permissão"
        description={
          soAdmin
            ? "Esta operação está reservada a administradores da coleção."
            : "A sua conta ainda não tem acesso a esta área. Peça a um administrador para lhe atribuir um perfil."
        }
      />
    </AppShell>
  );
}
