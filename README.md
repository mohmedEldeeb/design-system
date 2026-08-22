# Micro Design System — token pipeline

This is the tokens foundation for the React design system: Figma variables →
[Style Dictionary](https://styledictionary.com) → CSS custom properties +
a Tailwind theme, previewed live in Storybook. It's deliberately scoped to
**tokens only** — no components yet. [Radix UI](https://www.radix-ui.com/)
is installed and ready for that next phase; pair its unstyled primitives
with the Tailwind classes this pipeline generates.

> 📖 **New here?** Start with [docs/HOW-IT-WORKS.md](./docs/HOW-IT-WORKS.md) —
> a guided tour of every folder and how the Figma → tokens → UI pipeline works.

## How it fits together

```
Figma (Variables)
   │  Figma MCP: get_variable_defs
   ▼
tokens/figma-raw/*.json        ← raw dump, one file per Figma frame/section
   │  npm run tokens:from-figma  (scripts/build-source-tokens.js)
   ▼
tokens/tokens.json             ← categorized Style Dictionary source
   │  npm run tokens:build       (style-dictionary.config.js)
   ▼
dist/css/variables.css         ← CSS custom properties (--color-*, --spacing-* ...)
dist/json/tailwind-tokens.json ← theme object, consumed by tailwind.config.js
dist/json/tokens.json          ← flat "dot.path": value map, for any JS consumer
   │
   ▼
tailwind.config.js  →  Tailwind utility classes (bg-*, text-*, rounded-*, shadow-*, ...)
stories/DesignTokens.stories.jsx → Storybook preview of every generated token
```

Run both steps together with:

```bash
npm install
npm run tokens:sync      # rebuilds tokens/tokens.json AND dist/**
npm run storybook        # http://localhost:6006 — "Foundations / Design Tokens"
```

## Re-syncing after a Figma change

1. In Figma, open the relevant frame(s) on the **✦ Color Tokens** page (or
   wherever new variables live) and select it, so the Figma MCP connector
   has a target.
2. Re-run `get_variable_defs` for that node (or ask Claude to do it) and
   overwrite/add the corresponding file in `tokens/figma-raw/`.
3. Run `npm run tokens:sync`. This regenerates `tokens/tokens.json` and
   every `dist/**` output. Storybook picks up the change on next reload.

There's no live Figma API wired in yet — `tokens/figma-raw/*.json` is a
point-in-time snapshot fetched through the Figma MCP connector inside a
Claude session. If you want push-button syncing without going through
Claude, the natural next step is a small Node script that calls the Figma
REST API (`GET /v1/files/:key/variables/local`) with a personal access
token and writes the same raw-dump shape.

## What's in `tokens/tokens.json`

Six top-level categories, all sourced from the file's **Color Tokens**
Figma page (Icon / Border / Text / Background sections):

- **color** — `color.{text,icon,border,background}.<role>.<variant>`, 326
  tokens total: neutral/static/on-brand/brand/information/error/warning/
  success/accents ramps (primary…quinary or vibrant/clear/deep ×
  default/hover/pressed/disabled), plus semantic fill/surface/float/overlay
  groups for backgrounds and borders.
- **spacing** — a single 0/4/6/8/16/24/32/48px scale. Figma exposed this
  same scale three times (`gap/*`, `padding/horizontal/*`,
  `padding/vertical/*`); the build script collapses them into one.
- **sizing** — icon/asset sizing steps (16px, 20px) found under `size/*`
  and `sizing/*`.
- **radius** — two scales: `radius.components.*` (none/xs/lg — buttons,
  inputs) and `radius.surface.*` (none/lg/xl/3xl — cards, containers).
- **borderWidth** — `borderWidth.button.medium` (1px), plus a
  `borderWidth.scale.*` entry Figma labels oddly under `border/*`; rename
  it once you confirm its intended use.
- **typography** — atoms (`fontFamily`, `fontSize`, `fontWeight`,
  `lineHeight`, `letterSpacing`, `paragraphSpacing`) plus composite
  `typography.textStyle.*` tokens (e.g. `label-small-regular`,
  `subheadline-medium-regular`) that reference the atoms via Style
  Dictionary's `{path.value}` syntax — change an atom, every text style
  using it updates.
- **shadow** — `3xs` and `4xs` elevation steps, each a 2-layer drop
  shadow, exposed as a single composited `boxShadow` value.

Every generated token keeps its original Figma variable name under
`extensions.figmaName` in `tokens/tokens.json`, so you can always trace a
token back to its source.

## Using the tokens

**CSS** — `dist/css/variables.css` defines one custom property per
primitive token (e.g. `--color-background-brand-vibrant-default`,
`--spacing-16`, `--radius-surface-lg`). Composite `typography.textStyle.*`
tokens are intentionally *not* emitted as CSS variables (a single CSS
custom property can't hold a full font shorthand cleanly) — use the
Tailwind `fontSize` entries for those, or read `dist/json/tokens.json` for
the raw values.

**Tailwind** — `tailwind.config.js` extends `theme` directly from
`dist/json/tailwind-tokens.json`, so you get utilities like:

```jsx
<button className="bg-background-brand-vibrant-default text-text-on-brand-primary
                    rounded-components-lg shadow-3xs px-16 py-8">
  Continue
</button>

<p className="text-label-medium-regular">Design system tokens, synced from Figma.</p>
```

Class names are verbose because they mirror Figma's own naming 1:1
(`color.background.brand.vibrant.default` → `bg-background-brand-vibrant-default`).
That's intentional for a first pass — it keeps the Figma ↔ code mapping
unambiguous. If it's too verbose once real components land, alias the
common ones in `tailwind.config.js` or flatten the token names in
`scripts/build-source-tokens.js`.

**Radix UI** — already in `dependencies` (the `radix-ui` package bundles
all primitives). When you start building components, style Radix's
unstyled primitives with the Tailwind classes above so every component
automatically tracks the Figma tokens.

## Storybook

`npm run storybook` serves a single story — **Foundations / Design
Tokens** — that renders every generated token directly from
`dist/json/tailwind-tokens.json`: typography samples, the spacing scale,
radius previews, shadow previews, and all 326 color swatches grouped by
category. It's the fastest way to eyeball whether a Figma sync produced
what you expected. Component stories can be added under `stories/` the
same way once the component layer exists.

## Known gaps / next steps

- **Dark mode** is planned — see [docs/DARK-MODE-SPEC.md](./docs/DARK-MODE-SPEC.md) for
  the full spec, phased implementation plan, and verification checklist.
- Only the four sections under Figma's "Color Tokens" page were pulled.
  If there are more variable collections elsewhere in the file (e.g. a
  dedicated spacing or typography page), fetch those too and add them to
  `tokens/figma-raw/` — the build script picks up any `.json` file dropped
  in that folder automatically.
- `borderWidth.scale.*` and the two radius groups (`components` vs
  `surface`) are best-guess category names inferred from Figma's naming;
  confirm/rename them against how the file's authors actually use them.
- No automated Figma→repo sync (see "Re-syncing" above) — today it's a
  manual `npm run tokens:sync` after refreshing `tokens/figma-raw/`.
- Components (Radix + Tailwind) are the next phase, out of scope here.
