import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/**
 * Library build for npm consumers (separate from Storybook's vite usage).
 * Emits dist/lib/index.js (ESM) + index.cjs (CJS). React and radix-ui stay
 * external — they are peer/regular dependencies resolved by the host app.
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist/lib",
    // Keep the token CSS / JSON siblings in dist/ intact.
    emptyOutDir: false,
    lib: {
      entry: path.resolve(dirname, "src/index.ts"),
      name: "MicroDesignSystem",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^radix-ui(\/.*)?$/,
      ],
    },
    sourcemap: true,
  },
});
