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

const typeStyles = ["display", "heading", "subheading", "label", "subheadline", "paragraph", "code"];
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
// Composite text styles, referencing the atoms above via Style Dictionary
// reference syntax so a change to an atom propagates automatically.
//
// Generated from the Figma "TYPOGRAPHY SYSTEM OVERVIEW" frame (node
// 9640-130857). Tuple layout:
//   [family, sizeStep, WeightLabel, famKey, sizeKey, weightKey, letterKey]
const textStyleDefs = [
  ["display","large","Regular","display","large","regular","96"],
  ["display","large","Medium","display","large","medium","96"],
  ["display","large","Bold","display","large","bold","96"],
  ["display","medium","Regular","display","medium","regular","72"],
  ["display","medium","Medium","display","medium","medium","72"],
  ["display","medium","Bold","display","medium","bold","72"],
  ["display","small","Regular","display","small","regular","60"],
  ["display","small","Medium","display","small","medium","60"],
  ["display","small","Bold","display","small","bold","60"],
  ["heading","large","Regular","heading","large","regular","48"],
  ["heading","large","Medium","heading","large","medium","48"],
  ["heading","large","Bold","heading","large","bold","48"],
  ["heading","medium","Regular","heading","medium","regular","40"],
  ["heading","medium","Medium","heading","medium","medium","40"],
  ["heading","medium","Bold","heading","medium","bold","40"],
  ["heading","small","Regular","heading","small","regular","32"],
  ["heading","small","Medium","heading","small","medium","32"],
  ["heading","small","Bold","heading","small","bold","32"],
  ["subheading","large","Regular","subheading","large","regular","28"],
  ["subheading","large","Medium","subheading","large","medium","28"],
  ["subheading","large","Bold","subheading","large","bold","28"],
  ["subheading","medium","Regular","subheading","medium","regular","24"],
  ["subheading","medium","Medium","subheading","medium","medium","24"],
  ["subheading","medium","Bold","subheading","medium","bold","24"],
  ["subheading","small","Regular","subheading","small","regular","20"],
  ["subheading","small","Medium","subheading","small","medium","20"],
  ["subheading","small","Bold","subheading","small","bold","20"],
  ["label","x-large","Regular","label","x-large","regular","18"],
  ["label","x-large","Medium","label","x-large","medium","18"],
  ["label","x-large","Semibold","label","x-large","semibold","18"],
  ["label","large","Regular","label","large","regular","16"],
  ["label","large","Medium","label","large","medium","16"],
  ["label","large","Semibold","label","large","semibold","16"],
  ["label","medium","Regular","label","medium","regular","14"],
  ["label","medium","Medium","label","medium","medium","14"],
  ["label","medium","Semibold","label","medium","semibold","14"],
  ["label","small","Regular","label","small","regular","12"],
  ["label","small","Medium","label","small","medium","12"],
  ["label","small","Semibold","label","small","semibold","12"],
  ["label","x-small","Regular","label","x-small","regular","10"],
  ["label","x-small","Medium","label","x-small","medium","10"],
  ["label","x-small","Semibold","label","x-small","semibold","10"],
  ["paragraph","x-large","Regular","paragraph","x-large","regular","18"],
  ["paragraph","x-large","Medium","paragraph","x-large","medium","18"],
  ["paragraph","x-large","Semibold","paragraph","x-large","semibold","18"],
  ["paragraph","large","Regular","paragraph","large","regular","16"],
  ["paragraph","large","Medium","paragraph","large","medium","16"],
  ["paragraph","large","Semibold","paragraph","large","semibold","16"],
  ["paragraph","medium","Regular","paragraph","medium","regular","14"],
  ["paragraph","medium","Medium","paragraph","medium","medium","14"],
  ["paragraph","medium","Semibold","paragraph","medium","semibold","14"],
  ["paragraph","small","Regular","paragraph","small","regular","12"],
  ["paragraph","small","Medium","paragraph","small","medium","12"],
  ["paragraph","small","Semibold","paragraph","small","semibold","12"],
  ["paragraph","x-small","Regular","paragraph","x-small","regular","10"],
  ["paragraph","x-small","Medium","paragraph","x-small","medium","10"],
  ["paragraph","x-small","Semibold","paragraph","x-small","semibold","10"],
  ["code","default","Regular","code","default","regular","12"],
  ["code","default","Medium","code","default","medium","12"],
  ["code","default","Semibold","code","default","semibold","12"],
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
// 8.5 Dark theme overrides (tokens/dark-theme.json, dot-path keyed)
//
//     { "color.background.error.vibrant.default": "#…", … }
//
// Values attach to the matching color token as `darkValue`. See
// docs/DARK-MODE-SPEC.md. Placeholder values come from
// scripts/build-dark-theme.js; replace with real Figma dark-mode values.
// ---------------------------------------------------------------------------
const DARK_FILE = path.join(__dirname, "..", "tokens", "dark-theme.json");
if (fs.existsSync(DARK_FILE)) {
  const dark = JSON.parse(fs.readFileSync(DARK_FILE, "utf8"));
  let matched = 0;
  const applyDark = (node, parts) => {
    for (const [key, child] of Object.entries(node)) {
      if (!child || typeof child !== "object") continue;
      if ("value" in child) {
        const dotPath = ["color", ...parts, key].join(".");
        if (child.type === "color" && typeof dark[dotPath] === "string") {
          child.darkValue = dark[dotPath];
          matched++;
        }
      } else {
        applyDark(child, [...parts, key]);
      }
    }
  };
  for (const bucket of ["text", "icon", "border", "background"]) {
    if (tokens.color[bucket]) applyDark(tokens.color[bucket], [bucket]);
  }
  console.log(`Attached ${matched} dark theme values from tokens/dark-theme.json`);
}

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------
fs.writeFileSync(OUT_FILE, JSON.stringify(tokens, null, 2) + "\n");
console.log(`Wrote ${OUT_FILE}`);
