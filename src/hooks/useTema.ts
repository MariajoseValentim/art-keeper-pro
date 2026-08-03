import { useCallback, useEffect, useState } from "react";

export type Tema = "escuro" | "claro";

const CHAVE = "tt-tema";

function aplicar(tema: Tema) {
  const root = document.documentElement;
  root.classList.toggle("dark", tema === "escuro");
}

/** Modo escuro por defeito, com alternância guardada no dispositivo. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("escuro");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(CHAVE);
    const inicial: Tema = guardado === "claro" ? "claro" : "escuro";
    setTema(inicial);
    aplicar(inicial);
    setPronto(true);
  }, []);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === "escuro" ? "claro" : "escuro";
      localStorage.setItem(CHAVE, proximo);
      aplicar(proximo);
      return proximo;
    });
  }, []);

  return { tema, alternar, pronto };
}
