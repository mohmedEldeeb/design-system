# Project Explained — A Presentation Guide

This document is written so you can either read it top-to-bottom to understand
the whole project, or turn each `##` section into a slide. Every technology
choice is paired with a **Why** so you can defend it in a Q&A.

Related docs (more detail on specific slices): [README.md](../README.md) ·
[CLAUDE.md](../CLAUDE.md) · [HOW-IT-WORKS.md](./HOW-IT-WORKS.md) ·
[WORKFLOW.md](../WORKFLOW.md) · [REACT_GUIDE.md](../REACT_GUIDE.md) ·
[DARK-MODE-SPEC.md](./DARK-MODE-SPEC.md)

---

## 1. What this project is (elevator pitch)

**`micro-design-system`** is an npm package that turns a Figma design system
into typed, themeable, RTL-ready building blocks for any web app:

- **Design tokens** (colors, spacing, radius, shadows, typography) exported as
  CSS custom properties, a Tailwind preset, and typed TS objects.
- **React components** (`Button`, `Checkbox`, `LinkButton`, `SocialButton`)
  built on those tokens, so they re-theme and re-brand for free.
- **One source of truth**: Figma. Nobody hand-writes a hex code or a `px`
  value in application code — they import a token.

The pitch in one sentence: *"Change a color in Figma, run one command, and
every app that depends on this package gets the update — light mode, dark
mode, and RTL, without touching component code."*

---

## 2. The problem this solves

Without a system like this, every app team:

- Copies hex codes and pixel values out of Figma by hand → drifts from design
  over time, no single source of truth.
- Reinvents `Button`, `Checkbox`, etc. per project, each with slightly
  different states and accessibility behavior.
- Bolts on dark mode and RTL support late, as a painful retrofit.

This repo front-loads all three problems: tokens are generated (never
hand-typed), components are shared, and dark mode / RTL are architectural
decisions baked in from the start.

---

## 3. The pipeline — the core idea

Everything flows one direction. Nothing downstream is ever hand-edited:

```
Figma (Variables)
   │  designer updates colors/spacing/type in Figma
   ▼
tokens/figma-raw/*.json            ← raw snapshot, pulled via Figma MCP
   │  npm run tokens:from-figma  (scripts/build-source-tokens.ts)
   ▼
tokens/tokens.json                 ← categorized Style Dictionary source
   │  npm run tokens:build       (style-dictionary.config.ts)
   ▼
dist/css/variables.css             ← CSS custom properties (--color-*, …)
dist/json/tailwind-tokens.json     ← Tailwind theme object
dist/json/tokens.json              ← flat "dot.path": value map
   │  npm run tokens:gen-ts       (scripts/generate-ts-tokens.ts)
   ▼
src/generated/tokens.ts            ← typed TS token objects (autocomplete!)
src/generated/typography.ts        ← typed typography.* style objects
   ▼
React components, Tailwind classes, CSS vars, raw JSON
   → all consumed by Storybook (internal QA) and by any app that npm-installs
     this package
```

**Why one-directional?** If code could write back to `tokens.json` or Figma
could be edited from two places, the "source of truth" claim breaks. A
strict pipeline means `git diff` on generated files always tells you exactly
what changed in Figma — nothing is ever silently hand-patched.

---

## 4. Why Figma is the input, not hand-written JSON

- Designers already work in Figma; token names in code should mirror what
  they see in the panel (`bg/brand/vibrant/default` → `background.brand.vibrant.default`).
  No translation layer for humans to keep in sync.
- Figma Variables already encode the semantic structure (text/icon/border/background ×
  neutral/brand/error/…) — `scripts/build-source-tokens.ts` just needs to
  recognize that naming convention and re-bucket it.
- There is **no live Figma API integration on purpose** — `tokens/figma-raw/`
  is a manual, reviewable snapshot (a JSON file you can diff in a PR), not a
  network call that could change silently at build time or in CI.

---

## 5. The tech stack, tool by tool, and why each one was picked

| Tool | Role | Why this one |
|---|---|---|
| **Style Dictionary** | Transforms one token source into many output formats (CSS, Tailwind JSON, flat JSON) | Purpose-built for exactly this token-transform problem; industry standard (Amazon-originated) so the config is portable knowledge, not a bespoke script. Custom formats are just JS functions — no fighting a rigid templating DSL. |
| **TypeScript (`strict`)** | Type-checks components, scripts, and generated tokens | Token paths are deep (`colors.text.neutral.primary`) — autocomplete + compile-time errors catch typos that would otherwise only surface visually. `strict` is the gate `npm run typecheck` enforces in CI. |
| **Tailwind CSS** | Utility classes generated from the token theme | Consumers get token-driven classes (`bg-background-brand-vibrant-default`) without writing any CSS. The Tailwind preset is just the token JSON reshaped — no parallel design language to maintain. |
| **`tsx`** (not `ts-node` or a build step) | Runs `.ts` pipeline scripts directly | Zero-config TS execution for Node scripts (`scripts:*`). Avoids compiling scripts to JS before running them, or fighting `ts-node`'s ESM interop issues. |
| **React 18/19 + Radix UI (`radix-ui`)** | Component layer | `Checkbox` is built on Radix's unstyled `Checkbox.Root`/`Indicator` for correct ARIA semantics, keyboard behavior, and the tri-state (`checked \| "indeterminate"`) contract — accessibility that's easy to get subtly wrong by hand. Radix ships **unstyled**, so 100% of the visual language still comes from this repo's tokens, not a third-party design language. |
| **Vite** (`vite.lib.config.ts`) | Builds the publishable library (`dist/lib/*.js/.cjs`) | Fast, native ESM, minimal config for a dual ESM+CJS library build. `react`/`react-dom`/`radix-ui` are marked `external` so the published package doesn't bundle its own copy of React. |
| **Storybook 8** | Live component + token preview, the primary visual QA tool | `stories/DesignTokens.stories.tsx` renders every generated token — this is literally how you verify a Figma sync worked before shipping. Also doubles as living documentation for consumers of the components. |
| **Vitest + Testing Library + jsdom** | Unit/behavior tests | Native Vite integration (same config style as the rest of the toolchain), fast, ESM-native — chosen explicitly over Jest to avoid Jest's ESM/`tsx` interop friction (see [TESTING-PLAN.md](./TESTING-PLAN.md)). Tests assert **behavior** (click toggles, disabled ignores clicks, ARIA state) never inline style snapshots — style correctness is Storybook's job, not the test suite's. |
| **`@storybook/test-runner` + Playwright** | Whole-suite smoke test | Visits every story in a real browser and fails on any render crash — a cheap net that catches "this variant combination throws" bugs the unit tests don't target individually. |
| **PostCSS + Autoprefixer** | CSS processing for Tailwind | Required by Tailwind's build pipeline; adds vendor prefixes so generated CSS works across target browsers without manual prefixing. |
| **npm workspaces-free, single package** | Repo shape | The project is small enough (tokens + 4 components) that a monorepo/workspaces split would be pure overhead — one `package.json`, one publish target. |

---

## 6. Why tokens are exported five different ways

Look at `src/index.ts` and the README's "What's exported" table — the same
token is available as:

1. **CSS custom properties** (`var(--color-background-brand-vibrant-default)`) — for any framework, or plain CSS.
2. **Tailwind classes** (`bg-background-brand-vibrant-default`) — for apps already using Tailwind.
3. **Typed TS objects** (`colors.background.brand.vibrant.default`) — for inline styles / CSS-in-JS with autocomplete.
4. **Flat JSON** (`"color.background.brand.vibrant.default": "#…"`) — for non-JS consumers, CI checks, or dynamic lookups.
5. **Resolved hex via `flat` / `darkColors`** — because `<canvas>`, SVG chart libraries, and most charting tools **cannot** read a `var()` reference; they need an actual color string per theme.

**Why not just one format?** Because "any framework, any use case" is the
product promise. A Vue app only needs #1. A React app doing charts needs #5.
Forcing everyone through one export shape would mean either bloating every
consumer with Tailwind, or losing the CSS-var theming story for people who
don't use React.

---

## 7. Component architecture — why plain inline styles, not CSS classes

Look at `Button.tsx` / `Checkbox.tsx`: no CSS Modules, no styled-components,
no Tailwind classes inside the component source — variant styling is computed
in JS and applied via the `style` prop, using `var(--color-…)` strings.

**Why:**

- **Theme-reactivity for free.** A `var()` reference resolves differently
  under `[data-theme="dark"]` automatically — the component never needs to
  know or care which theme is active. If components used baked-in Tailwind
  color classes compiled to hex, dark mode would require a second class set.
- **No CSS bundling/specificity problem for a published package.** Shipping a
  component library as a set of React functions with inline `style` avoids
  asking every consumer app to also load a components stylesheet with the
  "right" specificity relative to their own CSS.
- **Variant matrices stay data, not class-name strings.** `VARIANTS[type][hierarchy]`
  is a plain object lookup — easy to test exhaustively (`Button.test.tsx`
  loops every `type × hierarchy × size` combination) and easy for TypeScript
  to make exhaustive (`Record<ButtonType, Record<ButtonHierarchy, VariantStyle>>`).
- Interaction states (hover/active/focus) are plain `useState` + conditional
  style swaps — no CSS `:hover` needed, and the same swap logic works
  identically regardless of the active theme.

**Trade-off acknowledged:** this means no CSS specificity wars for consumers,
but it also means these are *not* Tailwind-first components — they're
token-first, framework-agnostic-styling components. That's a deliberate
scope decision, not an oversight.

---

## 8. Why `radix-ui` specifically for `Checkbox`

`Button` and `LinkButton` are simple enough to hand-roll. `Checkbox` is not:
it has a tri-state value (`checked | unchecked | indeterminate`), must be
operable by keyboard (Space to toggle), and must expose correct
`aria-checked` semantics. Radix's `Checkbox.Root` / `Checkbox.Indicator`
solve exactly that, unstyled — so this repo supplies 100% of the visuals via
tokens while Radix supplies the accessibility contract. Building that by hand
is a common source of subtle a11y bugs; outsourcing it to a widely-used
primitive library is the more defensible engineering choice for a shared
package other teams will depend on.

---

## 9. Dark mode — how, and why this mechanism

**How:** the generated stylesheet ships a light palette on `:root` and
overrides under `[data-theme="dark"]`. Switching themes is:

```ts
setTheme("dark"); // sets document.documentElement.setAttribute("data-theme", "dark")
```

**Why an HTML attribute, not a React Context or a class toggle:**

- **Zero re-render.** Every `var(--color-…)` reference in every component
  updates instantly when the browser re-resolves CSS custom properties — no
  component tree re-render, no prop drilling a `theme` value through the app.
- **Works outside React.** Vue/Svelte/Angular consumers (see README's
  "Framework examples") get dark mode for free by importing the CSS and
  setting one attribute — no dependency on this package's JS at all if they
  only use `variables.css`.
- **Single flip point.** `setTheme` / `getTheme` / `toggleTheme` in
  `src/theme.ts` are ~20 lines total specifically because the mechanism is
  "read/write one attribute" — there's no state store to keep in sync.

Dark values are generated per-token as a `darkValue` field during the token
merge step (from `tokens/dark-theme.json`, dot-path keyed), and Style
Dictionary emits them into the `[data-theme="dark"]` block. See
[DARK-MODE-SPEC.md](./DARK-MODE-SPEC.md) for the full phased rollout plan and
current status.

---

## 10. RTL / bidirectional support — why it's a first-class constraint

This is called out explicitly in `CLAUDE.md` as a standing rule, not a
one-off feature:

- **Tokens are direction-agnostic by construction.** Spacing uses
  `gap` / `padding-horizontal` / `padding-vertical` — never `margin-left`
  or `padding-right` — so there is no "flip the tokens for RTL" step needed;
  the token layer simply has no physical-direction concept to flip.
- **Components use logical CSS properties** (`marginInlineStart`,
  Tailwind's `ms-*`/`me-*`/`ps-*`/`pe-*`, `start-*`/`end-*`) instead of
  `ml-*`/`mr-*`/`left-*`/`right-*`. Logical properties automatically mirror
  when `dir="rtl"` is set on the page — no per-component RTL branch needed
  for spacing/position.
- **Typography has an Arabic-specific correction.** Plus Jakarta Sans (the
  Figma-specified font) has no Arabic glyphs, so `fontStack()`
  (`src/components/typography.ts`) always appends
  `Arial, Tahoma, "Segoe UI", sans-serif` as fallbacks — every consumer gets
  a font that actually renders Arabic, without remembering to add fallbacks
  themselves.
- **Figma's negative letter-spacing breaks Arabic script**, so
  `src/index.css` / `dist/css/styles.css` force `letter-spacing: normal`
  under `[dir="rtl"] *` — a global, one-line fix instead of hunting down
  every component that sets tracking.
- **Storybook has a "Direction" toolbar global** so every story is checked
  in both LTR and RTL during review, not just at final QA.

**Why bake this in now instead of later:** RTL support retrofitted onto an
existing component library usually means auditing every `margin-left` in the
codebase after the fact. Making logical properties the *only* allowed
pattern from day one means there's nothing to retrofit.

---

## 11. TypeScript strategy — why "inference-first, minimal hand-written types"

Per [TYPESCRIPT-MIGRATION.md](./TYPESCRIPT-MIGRATION.md), the repo follows
one repeatable pattern for every component:

```ts
const SIZES = { small: {...}, medium: {...} } as const;
type Size = keyof typeof SIZES;              // derived, not hand-duplicated
type Hierarchy = "filled" | "tint" | "outline";
```

**Why:** the size/variant maps are the actual runtime data (they hold pixel
values, colors, etc.) — deriving the *type* from the *data* with `as const` +
`keyof typeof` guarantees the type can never drift from the values it
describes. Hand-writing `type Size = "small" | "medium"` separately from the
`SIZES` object would let the two silently disagree after an edit.

**Why generated `.ts` token files instead of importing the JSON directly:**
`src/generated/tokens.ts` and `src/generated/typography.ts` are produced by
`scripts/generate-ts-tokens.ts` rather than consumers doing
`import tokens from "./tokens.json"` everywhere. Reason, straight from the
script's own header comment: generated TS keeps every component's `.d.ts`
output **self-contained** when the package is published — no relative JSON
import specifiers leak into the published type declarations, which would
break for consumers whose bundler resolves JSON differently.

---

## 12. Testing strategy — why this suite and not a bigger one

Philosophy (from [TESTING-PLAN.md](./TESTING-PLAN.md)): *test behavior
through the DOM, never snapshot styles — if a test would just re-assert an
inline style value, it belongs in the Storybook visual matrix instead.*

What's actually tested:

- **Variant-matrix completeness** — every `type × hierarchy × size`
  combination renders without crashing (`Button.test.tsx`). This is a real
  regression class this repo already hit (a specific `unchecked × tint`
  crash in `Checkbox`).
- **Behavior, not appearance** — click fires `onClick`, disabled ignores
  clicks, controlled vs. uncontrolled `Checkbox` state, indeterminate → click
  → checked (Radix's own coercion contract), consumer event handlers compose
  with internal hover/focus tracking (a "spread-order" regression class that
  bit this repo before — see the `Button.test.tsx` comments literally titled
  *"consumer prop composition (spread-order regression guards)"*).
- **Token pipeline shape assertions** (`scripts/__tests__/`) — not byte-for-byte
  snapshots of generated output (those would break on every legitimate Figma
  sync), but *shape* checks: every category exists, dark values attach
  correctly, composite Figma strings (`Font(...)`, `Effect(...)`) get
  skipped in the generic pass instead of corrupting output.
- **Storybook test-runner** (`npm run test:stories`) — builds Storybook,
  then visits every story in a real Chromium instance via Playwright; catches
  any render crash across the *entire* story set as a cheap blanket net,
  independent of the targeted unit tests above.

**Explicitly not tested:** inline style *values* per state (that's what the
Storybook token/component gallery is for), Radix's internals (tested
upstream already), and generated `dist/**` output byte-for-byte.

---

## 13. Build & publish — how this becomes an installable package

```
npm run build
  = tokens:sync        (Figma raw → tokens.json → dist/css + dist/json)
  + build:lib           (vite.lib.config.ts → dist/lib/index.js + .cjs)
  + build:types          (tsc -p tsconfig.build.json → dist/lib/*.d.ts)
```

`package.json`'s `exports` map then exposes each output at a stable
sub-path consumers import directly:

| Import path | What it resolves to |
|---|---|
| `micro-design-system` | `dist/lib/index.js` / `.cjs` — components, tokens, helpers |
| `micro-design-system/styles.css` | `dist/css/styles.css` — CSS vars + Tailwind base |
| `micro-design-system/variables.css` | CSS vars only, no Tailwind reset |
| `micro-design-system/tailwind-preset` | drop-in Tailwind `presets: []` entry |
| `micro-design-system/tokens.json` | flat token map for non-bundler consumers |

`react` / `react-dom` are **peer dependencies**, not regular dependencies —
so a consumer app's own React instance is used instead of bundling a second
copy (a classic cause of "Invalid Hook Call" bugs when two React copies
coexist).

`prepublishOnly` runs `typecheck && test && build` — so a broken build or a
failing test **cannot** be published to npm by accident.

---

## 14. CI — what gets verified on every push/PR

`.github/workflows/ci.yml`, in order:

1. `npm ci` — clean, lockfile-exact install (never `npm install` in CI, to
   guarantee reproducibility).
2. `npm run tokens:sync` — re-run the *entire* token pipeline from the
   checked-in `tokens/figma-raw/*.json`.
3. **Drift guard**: `git diff --exit-code src/generated dist/json dist/css`
   — fails the build if regenerating the pipeline produces output different
   from what's committed. This is the mechanism that guarantees "generated
   files are never hand-edited" isn't just a convention — it's enforced.
4. `npm run typecheck` — the TypeScript gate.
5. `npm test` — the Vitest suite.

**Why the drift guard is the most important line:** without it, someone
could hand-edit `dist/css/variables.css` to "quickly fix" something, and
nothing would ever catch that the checked-in file no longer matches what the
pipeline actually produces from source. This one command is what keeps
Figma the real source of truth instead of a suggestion.

---

## 15. Suggested slide order (if presenting live)

1. **Title / elevator pitch** — §1
2. **The problem** — §2 (drift, duplicated components, late RTL/dark-mode)
3. **The pipeline diagram** — §3 (this is the one diagram worth drawing big)
4. **Tech stack table** — §5 (pick 3–4 rows to talk through live, don't read all of it)
5. **Five ways to consume one token** — §6 (live demo: same color, CSS var / Tailwind class / TS object)
6. **Why inline styles + tokens for components** — §7
7. **Dark mode in one attribute** — §9 (live toggle demo is very effective)
8. **RTL as a first-class constraint** — §10 (flip a Storybook story live)
9. **The CI drift guard** — §14 (this is the "trust" slide — explain why generated output can't silently rot)
10. **What's next** — component layer is new (`radix-ui` already a
    dependency for more primitives), dark-mode values are still placeholders
    pending real Figma dark-mode export (see [DARK-MODE-SPEC.md](./DARK-MODE-SPEC.md) Phase 0).

---

## 16. Honest current limitations (good to pre-empt in Q&A)

- **Dark mode values are placeholders** in `tokens/dark-theme.json` until
  real Figma dark-mode variables are exported (blocked on Figma API scope —
  see DARK-MODE-SPEC.md §2–3).
- **Figma sync is manual**, not a live integration — a deliberate choice
  (reviewable diffs > silent network calls) but it does mean someone has to
  remember to re-pull after a Figma change.
- **Only 4 components exist today** (`Button`, `Checkbox`, `LinkButton`,
  `SocialButton`). The component layer is intentionally small and growing —
  `radix-ui` is already a dependency specifically so new primitives (Select,
  Tabs, Dialog, …) can be styled the same token-driven way.
- **Sizing tokens aren't wired into Tailwind** yet (see the token-category
  table in CLAUDE.md) — they exist in the pipeline but have no Tailwind theme
  key mapped.
