import { readFile } from "node:fs/promises";
import { it } from "vitest";
import { extrairTexto, textoParaRegistos } from "/dev-server/src/lib/extracao";
it("dump", async () => {
  for (const n of ["ficha-unica.pdf","multiplas-fichas-mesma-pagina.pdf","multiplas-paginas.pdf"]) {
    const d = await readFile(`/dev-server/src/lib/__fixtures__/${n}`);
    const t = await extrairTexto(new File([new Uint8Array(d)], n));
    console.log("=== ", n, "\n", t, "\n---", JSON.stringify(textoParaRegistos(t), null, 1));
  }
});
