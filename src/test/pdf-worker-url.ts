/** Em Node o worker do pdf.js é carregado a partir do caminho absoluto no disco. */
import { fileURLToPath } from "node:url";

export default fileURLToPath(
  new URL("../../node_modules/pdfjs-dist/build/pdf.worker.mjs", import.meta.url),
);
