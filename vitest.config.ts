import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      {
        find: "pdfjs-dist/build/pdf.worker.mjs?url",
        replacement: new URL("./src/test/pdf-worker-url.ts", import.meta.url).pathname,
      },
    ],
  },

    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
});
