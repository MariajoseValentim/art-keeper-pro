import { Moon, Sun } from "lucide-react";
import { useTema } from "@/hooks/useTema";

export function BotaoTema({ className = "" }: { className?: string }) {
  const { tema, alternar, pronto } = useTema();
  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors duration-200 hover:border-accent hover:text-accent ${className}`}
    >
      {pronto && !escuro ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
