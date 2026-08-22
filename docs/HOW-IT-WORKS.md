# How This Project Works

A guided tour of the design system: what every folder does, how tokens flow
from Figma to code, and where each piece of the pipeline lives.
(Commands-only quick reference: see [../WORKFLOW.md](../WORKFLOW.md).)

---

## 1. The big picture

This repo is a **tokens-first design system**. Figma is the single source of
truth; everything in `dist/` is generated and must never be edited by hand.

```
Figma (Variables & component specs)
  │  manual snapshot / REST API / MCP
  ▼
tokens/figma-raw/*.json        raw "variable-name": value dumps
  │  npm run tokens:from-figma  (scripts/build-source-tokens.js)
  ▼
tokens/tokens.json             categorized Style Dictionary source
  (+ tokens/dark-theme.json    dark overrides, dot-path keyed)
  │  npm run tokens:build      (style-dictionary.config.js)
  ▼
dist/css/variables.css         :root light + [data-theme="dark"] CSS variables
dist/json/tailwind-tokens.json Tailwind theme (colors as var() references)
dist/json/tokens.json          flat "color.background.x.y": "#hex" map
  ▼
Tailwind classes · CSS vars · JS imports   ← components & stories consume these
```

## 2. Folder guide

| Path | What it is | Edit by hand? |
|---|---|---|
| `tokens/figma-raw/` | Raw JSON snapshots pulled from Figma. Any `.json` dropped here is merged automatically. | Only via sync |
| `tokens/dark-theme.json` | Dark values keyed by dot-path (`color.background.…`). Generated placeholder — replace with real Figma dark values. | Yes (this IS the source for dark) |
| `tokens/tokens.json` | Merged, categorized source for Style Dictionary. | ❌ generated |
| `scripts/build-source-tokens.js` | Merge step: figma-raw → tokens.json. Knows Figma's naming conventions (`bg/`, `text/`, `gap/`, composite `Font(...)` strings…). Also attaches `darkValue`s. | ✅ pipeline logic |
| `scripts/build-dark-theme.js` | Generates the placeholder dark palette; anchors real values extracted from the Figma Themes page. | ✅ heuristics live here |
| `style-dictionary.config.js` | Build step: three custom output formats (CSS vars incl. `[data-theme="dark"]`, Tailwind theme with `var()` colors, flat JSON). | ✅ output shapes |
| `tailwind.config.js` | Extends Tailwind's theme from `dist/json/tailwind-tokens.json`. Class names mirror Figma names verbatim. | Rarely |
| `src/components/` | The component layer: `Button.jsx`, `LinkButton.jsx`, `SocialButton.jsx`, brand icons. All colors via `var(--color-…)` so they follow the active theme automatically. | ✅ |
| `stories/` | Storybook pages: Foundations (DesignTokens, Typography, Colors) and Components (Button, Buttons = link+social). Include Controls + Actions playgrounds. | ✅ |
| `.storybook/` | Storybook config. `preview.js` wires the Light/Dark toolbar toggle (`data-theme`). `preview-head.html` loads Plus Jakarta Sans + themed body styles. | ✅ |
| `dist/` | **Generated output.** CSS variables + JSON token maps consumed by Tailwind, components, stories, and any external consumer. | ❌ always generated |
| `docs/` | Specs & plans (e.g. [DARK-MODE-SPEC.md](./DARK-MODE-SPEC.md)). | ✅ |

## 3. The token pipeline, step by step

### Step 1 — Snapshot from Figma → `tokens/figma-raw/*.json`

Each file is a flat map of Figma variable names to resolved values:

```json
{ "text/neutral/primary": "#050505", "gap/1rem (16px)": "16" }
```

Files are snapshots, not live — re-pull after Figma changes (REST API with a
personal access token, or the MCP connector).

### Step 2 — Merge & categorize → `tokens/tokens.json`

`scripts/build-source-tokens.js` recognizes Figma prefixes and buckets them:

| Figma prefix | Token category |
|---|---|
| `text/`, `icon/`, `bd/`, `bg/` | `color.{text,icon,border,background}.*` |
| `gap/`, `padding/*` | `spacing` (keyed by px) |
| `size/`, `sizing/` | `sizing` |
| `components/`, `surface/` | `radius.*` |
| `button/border/width/*` | `borderWidth` |
| `type/family|size|weight|line-height/…` | `typography` atoms |
| `Label/small-12/Regular` etc. (`Font(…)`) | `typography.textStyle.*` composites |
| `elevation/shadow/<step>/layer-n/*` | `shadow.<step>.composite` |

Every token keeps its original Figma name under `extensions.figmaName`.

It then reads `tokens/dark-theme.json` and attaches a `darkValue` to every
matching color token.

### Step 3 — Build outputs → `dist/`

`style-dictionary.config.js` registers three custom formats:

1. **CSS custom properties** — emits `:root { … }` plus a
   `[data-theme="dark"] { … }` block from each token's `darkValue`.
2. **Tailwind theme** — colors become `var(--color-…)` references (so
   utilities follow the active theme); spacing/radius/shadows stay literal;
   typography composites land in `fontSize` with metadata.
3. **Flat JSON** — `"color.background.error.vibrant.default": "#f32b36"` for
   non-Tailwind consumers.

## 4. How theming works

- Components never hardcode theme colors — they use
  `var(--color-background-error-vibrant-default)` style references.
- Switching themes = setting `data-theme="dark"` on `<html>` (Storybook's
  toolbar toggle does exactly this).
- Dark values come from `tokens/dark-theme.json`; regenerate placeholders with
  `npm run tokens:dark`, or paste real Figma dark values into that file.
- Full details: [DARK-MODE-SPEC.md](./DARK-MODE-SPEC.md).

## 5. Component conventions

- Plain React + inline styles referencing **CSS variable tokens** (no hardcoded
  hexes except intentional brand identities, e.g. social buttons).
- Interaction states (hover/press/focus) are React state → style swaps, so the
  same var() reference resolves differently per theme.
- Every component ships with two stories: a **Playground** (Controls +
  Actions) and an **All States** gallery synced against its Figma page.

## 6. Common tasks

| Task | Do this |
|---|---|
| Figma colors/spacing changed | New snapshot into `tokens/figma-raw/` → `npm run tokens:sync` → check Storybook |
| Adjust dark palette | Edit/generate `tokens/dark-theme.json` → `npm run tokens:sync` |
| Add a component | Build it with `var(--color-…)` refs in `src/components/`, add Playground + gallery stories |
| Verify nothing broke | `npm run build-storybook` (CI-style check) |
| Share/publish preview | Commit `storybook-static/` output to Netlify/Vercel/Pages |
