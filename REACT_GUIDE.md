# React Usage Guide — micro-design-system

> Full reference for using the design system in a React app.
> For the short version see [README.md](./README.md).

---

## Contents

1. [Setup](#1-setup)
2. [Button](#2-button)
3. [Checkbox](#3-checkbox)
4. [LinkButton](#4-linkbutton)
5. [SocialButton](#5-socialbutton)
6. [Typography](#6-typography)
7. [Colors](#7-colors)
8. [Dark mode](#8-dark-mode)
9. [Real-world example — Login page](#9-real-world-example--login-page)

---

## 1. Setup

### Vite + React

```bash
npm i micro-design-system
```

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "micro-design-system/styles.css"; // ← must be first CSS import
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

```js
// tailwind.config.js
module.exports = {
  presets: [require("micro-design-system/tailwind-preset")],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

### Next.js App Router

```tsx
// app/layout.tsx
import "micro-design-system/styles.css"; // ← import here, once

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```js
// tailwind.config.js (at project root)
module.exports = {
  presets: [require("micro-design-system/tailwind-preset")],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};
```

---

## 2. Button

```tsx
import { Button } from "micro-design-system";
```

### Props

| Prop | Type | Default | Values |
|---|---|---|---|
| `type` | `ButtonType` | `"brand"` | `"brand"` `"neutral"` `"destructive"` |
| `hierarchy` | `ButtonHierarchy` | `"filled"` | `"filled"` `"tint"` `"outlined"` `"ghost"` |
| `size` | `ButtonSize` | `"medium"` | `"x-small"` `"small"` `"medium"` `"large"` `"x-large"` |
| `disabled` | `boolean` | `false` | |
| `fab` | `boolean` | `false` | Icon-only circular button |
| `startIcon` | `ReactNode` | — | Icon before label |
| `endIcon` | `ReactNode` | — | Icon after label |
| `onClick` | `MouseEventHandler` | — | |

All native `<button>` attributes are also accepted (e.g. `aria-label`, `form`, `data-*`).

### All hierarchy variants

```tsx
// filled (default) — solid background
<Button hierarchy="filled" type="brand">Save</Button>
<Button hierarchy="filled" type="neutral">Cancel</Button>
<Button hierarchy="filled" type="destructive">Delete</Button>

// tint — light background, colored text
<Button hierarchy="tint" type="brand">Save</Button>
<Button hierarchy="tint" type="neutral">Cancel</Button>
<Button hierarchy="tint" type="destructive">Delete</Button>

// outlined — border only
<Button hierarchy="outlined" type="brand">Save</Button>
<Button hierarchy="outlined" type="neutral">Cancel</Button>
<Button hierarchy="outlined" type="destructive">Delete</Button>

// ghost — no border, no background
<Button hierarchy="ghost" type="brand">Save</Button>
<Button hierarchy="ghost" type="neutral">Cancel</Button>
<Button hierarchy="ghost" type="destructive">Delete</Button>
```

### All sizes

```tsx
<Button size="x-small">X-Small</Button>   // h-32px
<Button size="small">Small</Button>        // h-40px
<Button size="medium">Medium</Button>      // h-44px  ← default
<Button size="large">Large</Button>        // h-52px
<Button size="x-large">X-Large</Button>   // h-56px
```

### With icons

```tsx
import { Button, ChevronIcon } from "micro-design-system";

// icon before label
<Button startIcon={<ChevronIcon direction="left" />}>Back</Button>

// icon after label
<Button endIcon={<ChevronIcon direction="right" />}>Next</Button>

// icon-only (fab)
<Button fab startIcon={<ChevronIcon direction="right" />} aria-label="Next" />
```

### Disabled

```tsx
<Button disabled>Cannot click</Button>

// still show intent while disabled
<Button hierarchy="filled" type="brand" disabled>Submit</Button>
```

### Loading state (pattern)

```tsx
function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <Button
      type="brand"
      hierarchy="filled"
      disabled={loading}
      startIcon={loading ? <Spinner /> : undefined}
    >
      {loading ? "Saving…" : "Save"}
    </Button>
  );
}
```

### Controlled click

```tsx
function DeleteDialog() {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteItem();
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button hierarchy="outlined" type="neutral" onClick={onClose}>
        Cancel
      </Button>
      <Button hierarchy="filled" type="destructive" disabled={loading} onClick={handleDelete}>
        {loading ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}
```

---

## 3. Checkbox

```tsx
import { Checkbox } from "micro-design-system";
```

### Props

| Prop | Type | Default | Values |
|---|---|---|---|
| `hierarchy` | `CheckboxHierarchy` | `"filled"` | `"filled"` `"tint"` `"outline"` |
| `size` | `CheckboxSize` | `"medium"` | `"small"` `"medium"` `"large"` |
| `checked` | `boolean` | — | Controlled mode |
| `defaultChecked` | `boolean` | `false` | Uncontrolled mode |
| `indeterminate` | `boolean` | `false` | Partial selection state |
| `disabled` | `boolean` | `false` | |
| `onCheckedChange` | `(checked: boolean \| "indeterminate") => void` | — | |

### Uncontrolled (simplest)

```tsx
<Checkbox defaultChecked />
<Checkbox defaultChecked={false} />
```

### Controlled

```tsx
function TermsCheckbox() {
  const [accepted, setAccepted] = useState(false);

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox
        checked={accepted}
        onCheckedChange={(val) => setAccepted(val === true)}
      />
      I accept the terms and conditions
    </label>
  );
}
```

### Indeterminate (select-all pattern)

```tsx
function SelectAll({ items, selected, onToggleAll }) {
  const allSelected = selected.length === items.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <Checkbox
      checked={allSelected}
      indeterminate={someSelected}
      onCheckedChange={onToggleAll}
    />
  );
}
```

### All sizes and hierarchies

```tsx
// sizes
<Checkbox size="small" />     // 12px box
<Checkbox size="medium" />    // 16px box  ← default
<Checkbox size="large" />     // 20px box

// hierarchies
<Checkbox hierarchy="filled" />   // solid background when checked  ← default
<Checkbox hierarchy="tint" />     // light background when checked
<Checkbox hierarchy="outline" />  // border only, always visible
```

### Disabled

```tsx
<Checkbox disabled />
<Checkbox checked disabled />   // checked but not changeable
```

---

## 4. LinkButton

A button styled like a text link — inline, no background, no border.

```tsx
import { LinkButton } from "micro-design-system";
```

### Props

| Prop | Type | Default | Values |
|---|---|---|---|
| `type` | `LinkButtonType` | `"primary"` | `"primary"` `"information"` `"neutral"` `"success"` `"colored"` `"inverted"` |
| `size` | `LinkButtonSize` | `"medium"` | `"x-small"` `"small"` `"medium"` `"large"` `"x-large"` |
| `disabled` | `boolean` | `false` | |
| `startIcon` | `ReactNode` | — | |
| `endIcon` | `ReactNode` | — | |
| `onClick` | `MouseEventHandler` | — | |

### Examples

```tsx
// default
<LinkButton>Forgot password?</LinkButton>

// all types
<LinkButton type="primary">Primary link</LinkButton>
<LinkButton type="neutral">Neutral link</LinkButton>
<LinkButton type="information">Learn more</LinkButton>
<LinkButton type="success">View receipt</LinkButton>
<LinkButton type="inverted">White on dark</LinkButton>

// sizes
<LinkButton size="small">Small link</LinkButton>
<LinkButton size="large">Large link</LinkButton>

// with icon
<LinkButton endIcon={<ChevronIcon direction="right" />}>See all</LinkButton>

// disabled
<LinkButton disabled>Unavailable</LinkButton>
```

### Wrapping a real `<a>` tag

`LinkButton` renders a `<button>`. If you need a real anchor (for SEO or
Next.js `<Link>`), wrap it:

```tsx
import Link from "next/link";
import { LinkButton } from "micro-design-system";

// next/link wraps a button — fine for keyboard / screen readers
<Link href="/pricing" passHref legacyBehavior>
  <LinkButton as="a">View pricing</LinkButton>
</Link>
```

---

## 5. SocialButton

```tsx
import { SocialButton } from "micro-design-system";
```

### Props

| Prop | Type | Default | Values |
|---|---|---|---|
| `brand` | `SocialBrand` | `"google"` | `"google"` `"apple"` `"facebook"` `"linkedin"` `"x"` `"github"` |
| `hierarchy` | `SocialHierarchy` | `"outlined"` | `"filled"` `"tint"` `"outlined"` |
| `disabled` | `boolean` | `false` | |
| `onClick` | `MouseEventHandler` | — | |

### All brands

```tsx
<SocialButton brand="google">Continue with Google</SocialButton>
<SocialButton brand="apple">Continue with Apple</SocialButton>
<SocialButton brand="facebook">Continue with Facebook</SocialButton>
<SocialButton brand="linkedin">Continue with LinkedIn</SocialButton>
<SocialButton brand="x">Continue with X</SocialButton>
<SocialButton brand="github">Continue with GitHub</SocialButton>
```

### All hierarchies

```tsx
<SocialButton brand="google" hierarchy="outlined">Outlined (default)</SocialButton>
<SocialButton brand="google" hierarchy="filled">Filled</SocialButton>
<SocialButton brand="google" hierarchy="tint">Tint</SocialButton>
```

### OAuth click handler

```tsx
function SocialLogin() {
  async function handleGoogle() {
    const url = await getGoogleOAuthUrl();
    window.location.href = url;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SocialButton brand="google" onClick={handleGoogle}>
        Continue with Google
      </SocialButton>
      <SocialButton brand="apple" onClick={handleApple}>
        Continue with Apple
      </SocialButton>
    </div>
  );
}
```

---

## 6. Typography

```tsx
import { typography } from "micro-design-system";
```

`typography` is a plain object of React `CSSProperties`. Spread it into `style` — no class names needed.

### Full type tree

```
typography
├── display        → large / medium / small   × regular / medium / bold
├── heading        → large / medium / small   × regular / medium / bold
├── subheading     → large / medium / small   × regular / medium / bold
├── label          → x-large / large / medium / small / x-small  × regular / medium / semibold
├── paragraph      → x-large / large / medium / small / x-small  × regular / medium / semibold
└── code           → default                  × regular / medium / semibold
```

### Basic usage

```tsx
// page titles
<h1 style={typography.display.large.bold}>Display Large Bold</h1>
<h1 style={typography.display.medium.bold}>Display Medium Bold</h1>

// section headings
<h2 style={typography.heading.large.bold}>Heading Large</h2>
<h3 style={typography.heading.medium.medium}>Heading Medium</h3>
<h4 style={typography.subheading.large.semibold}>Subheading</h4>

// body text
<p style={typography.paragraph.large.regular}>Body copy goes here.</p>
<p style={typography.paragraph.medium.regular}>Smaller body copy.</p>

// labels / captions
<span style={typography.label.medium.semibold}>Button label</span>
<span style={typography.label.small.regular}>Caption text</span>
<span style={typography.label["x-small"].regular}>Tiny caption</span>

// code
<code style={typography.code.default.regular}>const x = 1;</code>
```

### Combine with color tokens

```tsx
import { typography, colors } from "micro-design-system";

<h1
  style={{
    ...typography.heading.large.bold,
    color: colors.text.brand.primary,
  }}
>
  Brand Heading
</h1>

<p
  style={{
    ...typography.paragraph.medium.regular,
    color: colors.text.neutral.secondary,
  }}
>
  Secondary body text
</p>
```

### TypeScript — generic component with full autocomplete

```tsx
import {
  typography,
  type TypographyFamily,
  type TypographySize,
  type TypographyWeight,
} from "micro-design-system";

interface TextProps<
  F extends TypographyFamily,
  S extends TypographySize<F>,
> {
  as?: keyof JSX.IntrinsicElements;
  family: F;
  size: S;
  weight: TypographyWeight<F, S>;
  color?: string;
  children: React.ReactNode;
}

function Text<F extends TypographyFamily, S extends TypographySize<F>>({
  as: Tag = "span",
  family,
  size,
  weight,
  color,
  children,
}: TextProps<F, S>) {
  const style = {
    ...(typography[family][size] as Record<string, unknown>)[weight as string],
    ...(color ? { color } : {}),
  };
  return <Tag style={style}>{children}</Tag>;
}

// Usage — TypeScript enforces valid combinations:
<Text family="heading" size="large" weight="bold">Title</Text>
<Text family="label"   size="small" weight="semibold">Badge</Text>
```

---

## 7. Colors

```tsx
import { colors, cssVar } from "micro-design-system";
```

`colors` mirrors the Figma variable structure. Every value is a `var(--color-…)` reference
that automatically follows the active theme (light / dark).

### Color groups

```
colors
├── text
│   ├── neutral       → primary / secondary / tertiary / quaternary / quinary
│   │   └── inverted  → primary / secondary / tertiary / quaternary / quinary
│   ├── static        → same scale (never changes between light/dark)
│   ├── on-brand      → use on brand-colored backgrounds
│   ├── brand         → brand-colored text
│   ├── information   → blue / info states
│   ├── error         → red / danger states
│   ├── warning       → yellow / warning states
│   └── success       → green / success states
├── background        → same groups as text
├── border            → same groups as text
└── icon              → same groups as text
```

### Inline style usage

```tsx
// text
<p style={{ color: colors.text.neutral.primary }}>Primary text</p>
<p style={{ color: colors.text.neutral.secondary }}>Secondary text</p>
<p style={{ color: colors.text.neutral.tertiary }}>Hint / placeholder</p>
<p style={{ color: colors.text.error.primary }}>Error message</p>
<p style={{ color: colors.text.success.primary }}>Success message</p>
<p style={{ color: colors.text.brand.primary }}>Brand accent text</p>

// backgrounds
<div style={{ background: colors.background["brand"]["vibrant"]["default"] }} />
<div style={{ background: colors.background.neutral.primary }} />

// borders
<div style={{ border: `1px solid ${colors.border.fill.primary}` }} />

// icons (pass to SVG fill)
<Icon style={{ color: colors.icon.neutral.primary }} />
```

### Tailwind classes (same tokens, no inline styles)

```tsx
// equivalent to the inline styles above, but as Tailwind classes
<p className="text-text-neutral-primary" />
<p className="text-text-neutral-secondary" />
<p className="text-text-error-primary" />
<div className="bg-background-brand-vibrant-default" />
<div className="border border-border-fill-primary" />
```

### `cssVar` — build references dynamically

```tsx
import { cssVar } from "micro-design-system";

// useful for computed styles where you don't know the path at compile time
function StatusText({ status }: { status: "error" | "success" | "warning" }) {
  return (
    <span style={{ color: cssVar(`text.${status}.primary`) }}>
      {status}
    </span>
  );
}
// → color: "var(--color-text-error-primary)" etc.
```

---

## 8. Dark mode

```tsx
import { setTheme, getTheme, toggleTheme, type ThemeName } from "micro-design-system";
```

Dark mode works by toggling `data-theme="dark"` on `<html>`. All CSS vars flip
instantly — no re-render, no context, no flicker.

### Simple toggle button

```tsx
function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeName>(getTheme());

  function toggle() {
    const next = toggleTheme();
    setThemeState(next);
  }

  return (
    <Button hierarchy="ghost" type="neutral" onClick={toggle}>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
```

### Persist to localStorage

```tsx
function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // restore on first load
    const saved = localStorage.getItem("theme") as ThemeName | null;
    const initial = saved ?? "light";
    setTheme(initial);
    return initial;
  });

  function toggle() {
    const next = toggleTheme();
    localStorage.setItem("theme", next);
    setThemeState(next);
  }

  return { theme, toggle };
}

// in your component
function App() {
  const { theme, toggle } = useTheme();

  return (
    <div>
      <Button onClick={toggle}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </Button>
    </div>
  );
}
```

### Respect system preference

```tsx
useEffect(() => {
  const saved = localStorage.getItem("theme") as ThemeName | null;

  if (saved) {
    setTheme(saved);
  } else {
    // follow OS preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }
}, []);
```

---

## 9. Real-world example — Login page

A complete login form using components, tokens, and dark mode together.

```tsx
import { useState } from "react";
import {
  Button,
  SocialButton,
  Checkbox,
  LinkButton,
  typography,
  colors,
  toggleTheme,
} from "micro-design-system";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.background.neutral.secondary,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: 400,
          padding: 32,
          borderRadius: 16,
          background: colors.background.neutral.primary,
          border: `1px solid ${colors.border.fill.secondary}`,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ ...typography.heading.medium.bold, color: colors.text.neutral.primary }}>
            Welcome back
          </h1>
          <p style={{ ...typography.paragraph.medium.regular, color: colors.text.neutral.secondary }}>
            Sign in to continue
          </p>
        </div>

        {/* Social logins */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SocialButton brand="google" hierarchy="outlined">
            Continue with Google
          </SocialButton>
          <SocialButton brand="apple" hierarchy="outlined">
            Continue with Apple
          </SocialButton>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: colors.border.fill.secondary }} />
          <span style={{ ...typography.label.small.regular, color: colors.text.neutral.tertiary }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, background: colors.border.fill.secondary }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="email"
              style={{ ...typography.label.small.medium, color: colors.text.neutral.primary }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${colors.border.fill.primary}`,
                background: colors.background.neutral.primary,
                color: colors.text.neutral.primary,
                ...typography.paragraph.medium.regular,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label
                htmlFor="password"
                style={{ ...typography.label.small.medium, color: colors.text.neutral.primary }}
              >
                Password
              </label>
              <LinkButton size="small" type="primary">Forgot password?</LinkButton>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${colors.border.fill.primary}`,
                background: colors.background.neutral.primary,
                color: colors.text.neutral.primary,
                ...typography.paragraph.medium.regular,
                outline: "none",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...typography.label.small.regular, color: colors.text.error.primary }}>
              {error}
            </p>
          )}

          {/* Remember me */}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Checkbox
              size="medium"
              checked={remember}
              onCheckedChange={(val) => setRemember(val === true)}
            />
            <span style={{ ...typography.label.small.regular, color: colors.text.neutral.secondary }}>
              Remember me
            </span>
          </label>

          {/* Submit */}
          <Button
            type="brand"
            hierarchy="filled"
            size="large"
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {/* Footer */}
        <p
          style={{
            ...typography.label.small.regular,
            color: colors.text.neutral.tertiary,
            textAlign: "center",
          }}
        >
          Don't have an account?{" "}
          <LinkButton size="small" type="primary" onClick={() => navigate("/signup")}>
            Sign up
          </LinkButton>
        </p>
      </div>
    </div>
  );
}
```

---

## Tips

**Do this** | **Not this**
---|---
`colors.text.neutral.primary` | hardcoded `"#050505"`
`typography.heading.large.bold` | hardcoded `{ fontSize: "48px", fontWeight: 800 }`
`colors.background.neutral.primary` | `"white"` or `"#fff"`
`border: \`1px solid ${colors.border.fill.primary}\`` | `"1px solid #e0e0e0"`
`setTheme("dark")` | `document.documentElement.className = "dark"`

By always using tokens you get dark mode, future rebrands, and Figma sync for free.
