#!/usr/bin/env node
/**
 * build-dark-theme.js
 *
 * Generates a PLACEHOLDER dark palette at tokens/dark-theme.json from the
 * light values in dist/json/tokens.json. Heuristics:
 *
 *   - neutrals (low saturation): invert lightness, compress into 4%-96%
 *   - "clear" tints (very light chromatic): dark desaturated variant of the hue
 *   - "inverted.*" tokens: already dark-context colors — kept as-is
 *   - disabled grays: kept as-is (shared across themes)
 *   - everything else (vibrant/brand/error hues): slight darkening
 *
 * Replace this file's contents with real Figma dark-mode variable values
 * (see docs/DARK-MODE-SPEC.md Phase 0) — the rest of the pipeline reads
 * tokens/dark-theme.json as-is.
 *
 * Run with: npm run tokens:dark   (requires a prior tokens:build)
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "dist", "json", "tokens.json");
const OUT = path.join(__dirname, "..", "tokens", "dark-theme.json");

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

// ---------------------------------------------------------------------------
// Anchors extracted from the Figma "Themes" page (node 11606-73845), where the
// same variables are shown in light and dark modes. Applied when a token's
// LIGHT value matches exactly; everything else falls through to heuristics.
// ---------------------------------------------------------------------------
const SURFACE_ANCHORS = {
  "#f0f0f0": "#141414", // base / page background
  "#ffffff": "#1f1f1f", // card / raised surface
  "#f5f5f5": "#2a2a2a", // subtle fills
  "#ebebeb": "#242424",
  "#e6e6e6": "#2e2e2e",
  "#e0e0e0": "#383838",
  "#d5d5d5": "#474747",
};
const BORDER_ANCHORS = {
  "#f5f5f5": "#333333",
  "#ebebeb": "#292929",
  "#e0e0e0": "#3d3d3d",
  "#d5d5d5": "#474747",
};
const ACCENT_ANCHORS = {
  // brand vibrant/clear defaults, straight from the Figma dark theme preview
  "#274dff": "#6b8dff",
  "#eae9ff": "#2e354c",
};

function toDark(dotPath, hex) {
  // Dark-context colors: keep unchanged
  if (/\.inverted\./.test(dotPath)) return hex;
  if (/disabled$/.test(dotPath)) return hex;

  const [h, s, l] = hexToHsl(hex);

  // Neutral grays: flip lightness
  if (s < 0.15) {
    if (dotPath.startsWith("color.background.") && SURFACE_ANCHORS[hex]) return SURFACE_ANCHORS[hex];
    if (dotPath.startsWith("color.border.") && BORDER_ANCHORS[hex]) return BORDER_ANCHORS[hex];
    return hslToHex(h, s, Math.min(0.96, Math.max(0.04, 1 - l)));
  }

  if (ACCENT_ANCHORS[hex]) return ACCENT_ANCHORS[hex];

  // Very light chromatic tints ("clear" surfaces): dark desaturated variant
  if (l > 0.85) {
    return hslToHex(h, Math.min(s * 0.55, 0.35), 0.16);
  }
  // Very dark chromatic (deep pressed): lift slightly for visibility
  if (l < 0.2) {
    return hslToHex(h, s, Math.min(l + 0.08, 0.35));
  }
  // Mid/vibrant chromatic: darken slightly
  return hslToHex(h, s, Math.max(l * 0.82, 0.14));
}

const flat = JSON.parse(fs.readFileSync(SRC, "utf8"));
const out = {};
let count = 0;
for (const [k, val] of Object.entries(flat)) {
  if (!k.startsWith("color.") || !isHex(val)) continue;
  out[k] = toDark(k, val);
  count++;
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${OUT} (${count} placeholder dark values)`);
