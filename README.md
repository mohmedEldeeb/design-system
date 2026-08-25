# micro-design-system

Design tokens + React components synced from Figma.  
CSS custom properties, Tailwind preset, typed TS tokens, dark mode, RTL-ready.

```bash
npm i micro-design-system
```

---

## Quick setup (2 minutes)

### Step 1 — import the CSS (once, at your app root)

```tsx
// main.tsx / _app.tsx / layout.tsx
import "micro-design-system/styles.css";
```

This loads all CSS custom properties (`--color-*`, `--radius-*`, `--shadow-*`) and the
base Tailwind reset. **Required** — without it tokens render as empty `var()` calls.

### Step 2 — add the Tailwind preset (Tailwind apps only)

```js
// tailwind.config.js
module.exports = {
  presets: [require("micro-design-system/tailwind-preset")],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
};
```

That's it. You now have every Figma token available as a Tailwind class.

---

## Usage

### Components

```tsx
import { Button, Checkbox, LinkButton, SocialButton } from "micro-design-system";

<Button hierarchy="primary" size="md" onClick={handleClick}>
  Save
</Button>

<Checkbox size="md" hierarchy="primary" checked={isChecked} onChange={setIsChecked} />

<LinkButton size="sm" href="/dashboard">Go to dashboard</LinkButton>

<SocialButton brand="google" hierarchy="primary">Continue with Google</SocialButton>
```

### Tailwind classes (color · radius · shadow · typography)

```tsx
// colors  →  bg-{role}-{variant}  /  text-{role}-{variant}  /  border-{role}-{variant}
<div className="bg-background-brand-vibrant-default text-text-on-brand-primary" />
<p   className="text-text-neutral-primary" />
<div className="border border-border-fill-primary" />

// radius
<div className="rounded-components-lg" />   // buttons, inputs
<div className="rounded-surface-xl" />       // cards, modals

// shadow
<div className="shadow-3xs" />
<div className="shadow-4xs" />

// typography  (class = figma text style name)
<h1 className="text-display-large-bold" />
<p  className="text-body-medium-regular" />
<span className="text-label-small-medium" />
```

### TypeScript tokens (inline styles, CSS-in-JS, charting)

Every token is a fully-typed object — autocomplete works at every level.

```tsx
import { colors, typography, borderRadius, boxShadow } from "micro-design-system";

// colors → "var(--color-...)" references that follow the active theme
<p style={{ color: colors.text.neutral.primary }} />
<div style={{ background: colors.background.brand.vibrant.default }} />

// typography → ready-made React CSSProperties (fontFamily, fontSize, lineHeight, …)
<h1 style={typography.display.large.bold}>Title</h1>
<p  style={typography.body.medium.regular}>Body copy</p>
<span style={typography.label.small.medium}>Label</span>

// radius / shadow
<div style={{ borderRadius: borderRadius["components-lg"] }} />
<div style={{ boxShadow: boxShadow["3xs"] }} />
```

### `cssVar` helper — build CSS var references from dot-paths

```tsx
import { cssVar } from "micro-design-system";

// useful when you need a string, not an object key
const style = {
  background: cssVar("background.brand.vibrant.default"),
  // → "var(--color-background-brand-vibrant-default)"
  color: cssVar("text.on-brand.primary"),
  // → "var(--color-text-on-brand-primary)"
};
```

### Raw CSS custom properties (any framework)

If you're not using React or Tailwind, just import the variables CSS and use them directly:

```css
/* works in Vue, Svelte, Angular, vanilla — any framework */
@import "micro-design-system/variables.css";

.my-button {
  background: var(--color-background-brand-vibrant-default);
  color: var(--color-text-on-brand-primary);
  border-radius: var(--radius-components-lg);
  box-shadow: var(--shadow-3xs);
}
```

### Raw token JSON (scripts, CI, non-JS consumers)

```js
import tokens from "micro-design-system/tokens.json";
// flat dot-path map: { "color.text.neutral.primary": "#050505", ... }
```

### Canvas / SVG / Charts — actual hex values

CSS vars don't work inside `<canvas>` or charting libraries. Use `flat` (light) and
`darkColors` (dark) for the resolved hex values:

```tsx
import { flat, darkColors, getTheme } from "micro-design-system";

const brandColor =
  getTheme() === "dark"
    ? darkColors["color.background.brand.vibrant.default"]
    : flat["color.background.brand.vibrant.default"];

// use brandColor in Chart.js, D3, canvas drawRect, etc.
```

---

## Dark mode

The stylesheet ships a light palette on `:root` and overrides under
`[data-theme="dark"]`. No re-render or context needed — it's a single HTML attribute.

```tsx
import { setTheme, getTheme, toggleTheme } from "micro-design-system";

// set explicitly
setTheme("dark");
setTheme("light");

// read current
const current = getTheme(); // "light" | "dark"

// toggle
const next = toggleTheme(); // flips and returns the new value

// wire to a button
<button onClick={toggleTheme}>Toggle theme</button>
```

Every `var(--color-*)` reference in your CSS and every value from `colors.*` in TS
automatically reflects the active theme — nothing else to change.

---

## RTL / bidirectional

The token layer is direction-agnostic. When building components:

- Use logical CSS properties: `margin-inline-start`, `padding-inline-end`
- Use Tailwind logical variants: `ms-4`, `me-4`, `ps-4`, `pe-4`, `start-0`, `end-0`
- Never use physical: `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`

Set direction on the root element — tokens and components follow it automatically:

```html
<html dir="rtl" lang="ar">  <!-- Arabic -->
<html dir="ltr" lang="en">  <!-- English (default) -->
```

---

## What's exported

| Import | What you get |
|---|---|
| `"micro-design-system/styles.css"` | CSS vars + Tailwind base (import once) |
| `"micro-design-system/variables.css"` | CSS vars only (no Tailwind reset) |
| `"micro-design-system/tailwind-preset"` | Tailwind preset object for `tailwind.config.js` |
| `"micro-design-system/tokens.json"` | Flat `{ "dot.path": value }` map |
| `micro-design-system` (JS/TS) | Components, tokens, helpers — see table below |

**Named exports from `micro-design-system`:**

| Export | Type | Description |
|---|---|---|
| `Button` | Component | Primary action button |
| `Checkbox` | Component | Checkbox input |
| `LinkButton` | Component | Anchor-styled button |
| `SocialButton` | Component | OAuth social login button |
| `typography` | Object | `typography.display.large.bold` → React `CSSProperties` |
| `colors` | Object | `colors.text.neutral.primary` → `"var(--color-...)"` |
| `spacing` | Object | Spacing scale values |
| `borderRadius` | Object | Radius values |
| `borderWidth` | Object | Border width values |
| `boxShadow` | Object | Shadow values |
| `fontFamily` | Object | Font family stacks |
| `fontSize` | Object | Font size + metadata |
| `flat` | Object | Flat token map with resolved light-mode values |
| `darkColors` | Object | Flat token map with resolved dark-mode hex values |
| `cssVar(dotPath)` | Helper | Converts `"text.neutral.primary"` → `"var(--color-...)"` |
| `setTheme(name)` | Helper | `"light"` or `"dark"` — sets `data-theme` on `<html>` |
| `getTheme()` | Helper | Returns `"light"` or `"dark"` |
| `toggleTheme()` | Helper | Flips theme, returns new value |
| `fontStack()` | Helper | RTL-safe font-family string builder |

---

## Framework examples

### Next.js (App Router)

```tsx
// app/layout.tsx
import "micro-design-system/styles.css";
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```js
// tailwind.config.js  (or tailwind.config.ts)
const preset = require("micro-design-system/tailwind-preset");
module.exports = { presets: [preset], content: ["./app/**/*.{ts,tsx}"] };
```

### Vite + React

```tsx
// src/main.tsx
import "micro-design-system/styles.css";
```

```js
// tailwind.config.js
module.exports = {
  presets: [require("micro-design-system/tailwind-preset")],
  content: ["./src/**/*.{ts,tsx}"],
};
```

### Vue / Svelte / Angular (tokens only, no components)

```js
// main.js / main.ts
import "micro-design-system/variables.css";
```

```css
/* then use CSS vars anywhere */
.btn { background: var(--color-background-brand-vibrant-default); }
```

---

## Peer dependencies

```json
"react": ">=18.0.0",
"react-dom": ">=18.0.0"
```

Required only if you use the **components** or **`typography`** object.  
Token objects (`colors`, `flat`, `darkColors`, etc.) and CSS files have no React dependency.

---

## Contributing / token pipeline

See [CLAUDE.md](./CLAUDE.md) for the internal build pipeline (Figma → tokens → dist).
