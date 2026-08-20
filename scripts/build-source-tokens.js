#!/usr/bin/env node
/**
 * build-source-tokens.js
 *
 * Merges the raw Figma variable dumps in tokens/figma-raw/*.json (as pulled
 * via the Figma MCP `get_variable_defs` tool) into a single, categorized
 * Style Dictionary source file: tokens/tokens.json
 *
 * Re-run this whenever tokens/figma-raw/*.json is refreshed from Figma.
 */
const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "..", "tokens", "figma-raw");
const OUT_FILE = path.join(__dirname, "..", "tokens", "tokens.json");

// ---------------------------------------------------------------------------
// 1. Merge all raw dumps into one flat map (name -> resolved value string)
// ---------------------------------------------------------------------------
const flat = {};
for (const file of fs.readdirSync(RAW_DIR)) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), "utf8"));
  Object.assign(flat, data);
}

// Composite Figma debug strings like "Font(family: ...)" / "Effect(...)" are
// handled separately below (they are Figma's own serialization, not usable
// as literal Style Dictionary values), so we skip them during the generic
// color/number pass.
const isComposite = (key, value) =>
  typeof value === "string" &&
  (value.startsWith("Font(") || value.startsWith("Effect("));

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function setToken(root, pathParts, value, type, extra = {}) {
  let node = root;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const seg = pathParts[i];
    node[seg] = node[seg] || {};
    node = node[seg];
  }
  const last = pathParts[pathParts.length - 1];
  node[last] = { value, type, ...extra };
}

// Figma serializes numbers as float32, so values like letter-spacing come
// back as "0.10000000149011612". Round to a sane precision for output.
function roundNum(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return String(Math.round(n * 10000) / 10000);
}

function slug(seg) {
  return seg
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

// Extracts the px number out of a Figma name like "gap/1_5rem (24px)"
function pxFromLabel(name) {
  const m = name.match(/\((-?\d+(?:\.\d+)?)px\)/);
  return m ? m[1] : null;
}

const tokens = { color: {}, spacing: {}, sizing: {}, radius: {}, borderWidth: {}, typography: {}, shadow: {} };

// ---------------------------------------------------------------------------
// 2. Color tokens: icon/*, bd/*, text/*, bg/*
// ---------------------------------------------------------------------------
const colorPrefixes = { icon: "icon", bd: "border", text: "text", bg: "background" };
for (const [name, value] of Object.entries(flat)) {
  if (isComposite(name, value)) continue;
  const [prefix, ...rest] = name.split("/");
  if (!colorPrefixes[prefix] || rest.length === 0) continue;
  if (typeof value !== "string" || !value.startsWith("#")) continue;
  const bucket = colorPrefixes[prefix];
  const segs = rest.map(slug);
  setToken(tokens.color, [bucket, ...segs], value, "color", {
    extensions: { figmaName: name },
  });
}

// ---------------------------------------------------------------------------
// 3. Spacing scale: gap/*, padding/horizontal/*, padding/vertical/*
//    (collapsed into one scale keyed by px value — Figma exposes the same
//    scale three times as different variable collections/aliases)
// ---------------------------------------------------------------------------
for (const [name, value] of Object.entries(flat)) {
  if (!/^(gap|padding\/(horizontal|vertical))\//.test(name)) continue;
  const px = pxFromLabel(name);
  if (px === null) continue;
  setToken(tokens.spacing, [px], `${px}px`, "dimension", {
    extensions: { figmaName: name },
  });
}

// ---------------------------------------------------------------------------
// 4. Sizing scale (icon/asset sizing): size/*, sizing/*
// ---------------------------------------------------------------------------
for (const [name, value] of Object.entries(flat)) {
  if (!/^(size|sizing)\//.test(name)) continue;
  const px = pxFromLabel(name);
  if (px === null) continue;
  setToken(tokens.sizing, [px], `${px}px`, "dimension", {
    extensions: { figmaName: name },
  });
}

// ---------------------------------------------------------------------------
// 5. Radius scales: components/*, surface/*
// ---------------------------------------------------------------------------
for (const [name, value] of Object.entries(flat)) {
  const m = name.match(/^(components|surface)\/([a-zA-Z0-9-]+)$/);
  if (!m) continue;
  const [, group, step] = m;
  setToken(tokens.radius, [group, slug(step)], `${roundNum(value)}px`, "dimension", {
    extensions: { figmaName: name },
  });
}

// ---------------------------------------------------------------------------
// 6. Border width tokens
// ---------------------------------------------------------------------------
if (flat["button/border/width/medium"] !== undefined) {
  setToken(tokens.borderWidth, ["button", "medium"], `${roundNum(flat["button/border/width/medium"])}px`, "dimension", {
    extensions: { figmaName: "button/border/width/medium" },
  });
}
// Generic rem-scale value Figma labels under "border/*" — kept as a raw
// dimension for now; rename once you confirm its intended use in Figma.
for (const [name, value] of Object.entries(flat)) {
  const m = name.match(/^border\/([a-zA-Z0-9_.]+rem)\s*\(([-\d.]+)px\)$/);
  if (!m) continue;
  setToken(tokens.borderWidth, ["scale", `${m[2]}px`], `${value}rem`, "dimension", {
    extensions: { figmaName: name },
  });
}

// ---------------------------------------------------------------------------
// 7. Typography atoms
// ---------------------------------------------------------------------------
function getNum(name) {
  return flat[name] !== undefined ? flat[name] : null;
}

const typeStyles = ["label", "subheadline", "paragraph"];
for (const style of typeStyles) {
  const family = getNum(`type/family/${style}`);
  if (family !== null) setToken(tokens.typography, ["fontFamily", style], family, "fontFamily");
}
for (const [name, value] of Object.entries(flat)) {
  let m;
  if ((m = name.match(/^type\/size\/([a-z]+)\/([a-z-]+)$/))) {
    setToken(tokens.typography, ["fontSize", m[1], slug(m[2])], `${roundNum(value)}px`, "dimension", { extensions: { figmaName: name } });
  } else if ((m = name.match(/^type\/weight\/([a-z]+)\/([a-z-]+)$/))) {
    setToken(tokens.typography, ["fontWeight", m[1], slug(m[2])], Number(value), "fontWeight", { extensions: { figmaName: name } });
  } else if ((m = name.match(/^type\/line-height\/([a-z]+)\/([a-z-]+)$/))) {
    setToken(tokens.typography, ["lineHeight", m[1], slug(m[2])], `${roundNum(value)}px`, "dimension", { extensions: { figmaName: name } });
  } else if ((m = name.match(/^type\/paragraph-spacing\/([a-z]+)\/([a-z-]+)$/))) {
    setToken(tokens.typography, ["paragraphSpacing", m[1], slug(m[2])], `${roundNum(value)}px`, "dimension", { extensions: { figmaName: name } });
  } else if ((m = name.match(/^letter-spacing\/(\d+)$/))) {
    setToken(tokens.typography, ["letterSpacing", m[1]], `${roundNum(value)}px`, "dimension", { extensions: { figmaName: name } });
  }
}
if (flat["font/paragraphIndent/none"] !== undefined) {
  setToken(tokens.typography, ["paragraphIndent", "none"], `${roundNum(flat["font/paragraphIndent/none"])}px`, "dimension");
}

// Composite text styles, referencing the atoms above via Style Dictionary
// reference syntax so a change to an atom propagates automatically.
const textStyleDefs = [
  ["label", "small", "Regular", "label", "small", "regular", "12"],
  ["label", "small", "Medium", "label", "small", "medium", "12"],
  ["label", "medium", "Regular", "label", "medium", "regular", "14"],
  ["label", "x-large", "Regular", "label", "x-large", "regular", "18"],
  ["subheadline", "medium", "Regular", "subheadline", "medium", "regular", "24"],
  ["subheadline", "small", "Regular", "subheadline", "small", "regular", "20"],
  ["paragraph", "large", "Regular", "paragraph", "large", "regular", "16"],
  ["paragraph", "medium", "Regular", "paragraph", "medium", "regular", "14"],
];
tokens.typography.textStyle = {};
for (const [family, sizeStep, weightLabel, famKey, sizeKey, weightKey, letterKey] of textStyleDefs) {
  const name = `${family}-${sizeStep}-${weightLabel}`.toLowerCase();
  tokens.typography.textStyle[name] = {
    type: "typography",
    value: {
      fontFamily: `{typography.fontFamily.${famKey}.value}`,
      fontWeight: `{typography.fontWeight.${famKey}.${weightKey}.value}`,
      fontSize: `{typography.fontSize.${famKey}.${slug(sizeKey)}.value}`,
      lineHeight: `{typography.lineHeight.${famKey}.${slug(sizeKey)}.value}`,
      letterSpacing: `{typography.letterSpacing.${letterKey}.value}`,
    },
  };
}

// ---------------------------------------------------------------------------
// 8. Shadow tokens (elevation/shadow/<step>/layer-<n>/*) -> composite shadow
// ---------------------------------------------------------------------------
const shadowSteps = new Set();
for (const name of Object.keys(flat)) {
  const m = name.match(/^elevation\/shadow\/([a-z0-9]+)\/layer-(\d+)\//);
  if (m) shadowSteps.add(m[1]);
}
for (const step of shadowSteps) {
  const layers = [];
  for (let layer = 0; ; layer++) {
    const prefix = `elevation/shadow/${step}/layer-${layer}/`;
    if (flat[`${prefix}color`] === undefined) break;
    setToken(tokens.shadow, [step, `layer${layer}`, "color"], flat[`${prefix}color`], "color");
    setToken(tokens.shadow, [step, `layer${layer}`, "offsetX"], `${roundNum(flat[`${prefix}offset-x`])}px`, "dimension");
    setToken(tokens.shadow, [step, `layer${layer}`, "offsetY"], `${roundNum(flat[`${prefix}offset-y`])}px`, "dimension");
    setToken(tokens.shadow, [step, `layer${layer}`, "blur"], `${roundNum(flat[`${prefix}blur`])}px`, "dimension");
    setToken(tokens.shadow, [step, `layer${layer}`, "spread"], `${roundNum(flat[`${prefix}spread`])}px`, "dimension");
    layers.push(layer);
  }
  tokens.shadow[step].composite = {
    type: "boxShadow",
    value: layers.map((layer) => ({
      color: `{shadow.${step}.layer${layer}.color.value}`,
      offsetX: `{shadow.${step}.layer${layer}.offsetX.value}`,
      offsetY: `{shadow.${step}.layer${layer}.offsetY.value}`,
      blur: `{shadow.${step}.layer${layer}.blur.value}`,
      spread: `{shadow.${step}.layer${layer}.spread.value}`,
      type: "dropShadow",
    })),
  };
}

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------
fs.writeFileSync(OUT_FILE, JSON.stringify(tokens, null, 2) + "\n");
console.log(`Wrote ${OUT_FILE}`);
