#!/usr/bin/env tsx
/**
 * bundle-css.ts
 *
 * Composes the package stylesheet dist/css/styles.css:
 *   1. generated CSS custom properties (:root light + [data-theme="dark"])
 *   2. RTL helpers ([dir="rtl"] letter-spacing reset + .ds-flip-rtl)
 *
 * Run as part of `npm run build`.
 */
import fs from "node:fs";
import path from "node:path";

const DIST_CSS = path.resolve(import.meta.dirname, "..", "dist", "css");
const VARIABLES = path.join(DIST_CSS, "variables.css");
const OUT = path.join(DIST_CSS, "styles.css");

const rtlHelpers = `
/* --- RTL helpers ----------------------------------------------------------- */
[dir="rtl"] .ds-flip-rtl {
  transform: scaleX(-1);
}

[dir="rtl"] * {
  letter-spacing: normal !important;
}
`;

fs.writeFileSync(OUT, fs.readFileSync(VARIABLES, "utf8") + rtlHelpers);
console.log(`Wrote ${OUT}`);
