---
name: rtl
description: Apply right-to-left (RTL) support when creating or editing components, stories, typography, or tokens in this design system. Use whenever building UI that must work in both LTR and RTL locales.
---

# RTL support in the design system

Follow these rules whenever you create or modify components, stories, icons, or
typography. The token layer is already direction-agnostic — keep it that way.

## 1. Layout properties

- NEVER use physical properties or Tailwind classes:
  - `marginLeft` / `marginRight`, `ml-*` / `mr-*`
  - `paddingLeft` / `paddingRight`, `pl-*` / `pr-*`
  - `left-*` / `right-*` insets
- Use logical equivalents instead:
  - CSS inline styles → `marginInlineStart` / `marginInlineEnd` /
    `paddingInlineStart` / `paddingInlineEnd` / `insetInlineStart`
  - Tailwind classes → `ms-*` / `me-*` / `ps-*` / `pe-*`, `start-*` / `end-*`
    (built into Tailwind 3.4 — no plugin needed)
- Flexbox + `gap` handles most spacing; prefer it over margins entirely.

## 2. Alignment

- Never `textAlign: "left"` / `"right"`. Default start-alignment follows `dir`.
  If explicit alignment is needed use `"start"` / `"end"`.
- Tailwind: `text-start` / `text-end`, never `text-left` / `text-right`.

## 3. Icons

- Directional icons (chevrons, arrows) get the `ds-flip-rtl` class so they
  auto-mirror under RTL:
  ```jsx
  import { ChevronIcon } from "./icons"; // already carries ds-flip-rtl
  ```
  The rule lives in `src/index.css`: `[dir="rtl"] .ds-flip-rtl { transform: scaleX(-1); }`
- Add `ds-flip-rtl` to any newly authored icon with inherent direction.
- Prefer back/forward semantics in prop names (`startIcon`/`endIcon`), not sides.

## 4. Icon props

- Components accept `startIcon` / `endIcon` (logical). `leftIcon` / `rightIcon`
  exist only as deprecated aliases — do not use them in new code.

## 5. Typography

- ALWAYS set font families through `src/components/typography.js`:
  - `fontStack(name)` — Plus Jakarta Sans + Arabic-capable fallbacks
    (Arial/Tahoma/Segoe UI). PJS has no Arabic glyphs.
  - `fontStyle(tokenName)` — full style object for a typography token.
- Never use a bare `tw.fontFamily.*[0]` or hardcoded font strings.
- Do not re-add letter-spacing in RTL contexts — `src/index.css` zeroes it
  under `[dir="rtl"]` because Figma's negative tracking breaks Arabic script.
- Stories showing text specimens should include both a Latin (LTR) and an
  Arabic (`dir="rtl"` `lang="ar"`) specimen — see stories/Typography.stories.jsx.

## 6. Radix primitives

- Radix parts that accept a `dir` prop (Select, Tabs, Slider, Popover, …)
  must receive direction from context — never hardcode `"ltr"`.
  When building such components, read direction from the nearest `[dir]`
  ancestor or a shared locale/direction context.

## 7. Stories

- Storybook has a "Direction" toolbar global (`.storybook/preview.js`) wrapping
  every story in `<div dir>`. After adding/changing a story, verify it renders
  correctly with **both** Direction = LTR and RTL.
- Indentation/nesting offsets in story layouts use `paddingInlineStart`,
  not `paddingLeft`.

## Verification checklist before finishing any UI change

1. `grep -nE "marginLeft|marginRight|paddingLeft|paddingRight|textAlign.*[\"'](left|right)|ml-|mr-|pl-|pr-" <changed files>` → must be empty
2. New fonts only via `fontStack()` / `fontStyle()`
3. Directional icons carry `ds-flip-rtl`
4. Story checked visually in both toolbar directions
