/**
 * O pdf.js importa o módulo de canvas mesmo quando só extraímos texto e esse
 * módulo exige APIs do browser. Em Node fornecemos stubs mínimos.
 */
class DOMMatrixStub {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
}

class Path2DStub {
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  closePath() {}
  rect() {}
}

const g = globalThis as Record<string, unknown>;
g["DOMMatrix"] ??= DOMMatrixStub;
g["Path2D"] ??= Path2DStub;
g["ImageData"] ??= class ImageDataStub {};

// Node antigo não tem Promise.try, usado internamente pelo pdf.js.
const P = Promise as unknown as { try?: (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown> };
P.try ??= (fn, ...args) => new Promise((resolve) => resolve(fn(...args)));

// Uint8Array.prototype.toHex só existe em runtimes recentes.
const U8 = Uint8Array.prototype as unknown as { toHex?: () => string };
U8.toHex ??= function (this: Uint8Array) {
  return Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("");
};
