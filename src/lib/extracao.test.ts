import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { extrairTexto, textoParaRegistos } from "./extracao";

const fixture = async (nome: string) => {
  const caminho = fileURLToPath(new URL(`./__fixtures__/${nome}`, import.meta.url));
  const dados = await readFile(caminho);
  return new File([new Uint8Array(dados)], nome, { type: "application/pdf" });
};

const registos = async (nome: string) => textoParaRegistos(await extrairTexto(await fixture(nome)));

describe("importação de PDFs reais", () => {
  it("lê uma ficha simples com todos os campos", async () => {
    const [peca, ...resto] = await registos("ficha-unica.pdf");
    expect(resto).toHaveLength(0);
    expect(peca?.titulo).toBe("Cálice de prata dourada");
    expect(peca?.inventario).toBe("TT-0001");
    expect(peca?.autor).toBe("Oficina de Lisboa");
    expect(peca?.datacao).toBe("c. 1780");
    expect(peca?.materiais).toBe("Prata dourada");
    expect(peca?.dimensoes).toBe("24 x 12 x 12 cm");
    expect(peca?.proveniencia).toContain("Porto");
    expect(peca?.estado).toBe("bom");
    expect(peca?.localizacao).toBe("Sala 1, vitrine A");
  });

  it("separa várias fichas seguidas na mesma página", async () => {
    const lista = await registos("multiplas-fichas-mesma-pagina.pdf");
    expect(lista.map((p) => p.titulo)).toEqual([
      "Cálice de prata dourada",
      "Retrato de dama",
      "Relógio de mesa Império",
    ]);
    expect(lista[1]?.altura_cm).toBe("82");
    expect(lista[2]?.valor_estimado).toBe("4500");
    expect(lista[2]?.moeda).toBe("EUR");
  });

  it("lê uma ficha por página", async () => {
    const lista = await registos("multiplas-paginas.pdf");
    expect(lista).toHaveLength(3);
    expect(lista.map((p) => p.inventario)).toEqual(["TT-0001", "TT-0002", "TT-0003"]);
  });

  it("avisa quando o PDF é digitalizado e não tem OCR", async () => {
    await expect(extrairTexto(await fixture("digitalizado-sem-ocr.pdf"))).rejects.toThrow(/OCR/i);
  });
});
