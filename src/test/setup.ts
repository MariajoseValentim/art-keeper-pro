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
