# Testing Guide

This document explains **why this project has tests**, **what each layer catches**, and **how to write new ones**. It is a reference for contributors, not a plan — everything described here already exists and runs with `npm test`.

---

## Why test a design system?

A design system is infrastructure. When a component breaks, every screen in the product breaks. Bugs tend to fall into two categories:

1. **Silent runtime crashes** — a missing entry in a variant map, a token path that doesn't resolve, a CSS variable referenced but never defined. These produce blank or broken UI that TypeScript cannot catch because they depend on runtime data (CSS variables, token trees, Figma sync output).

2. **Prop-contract drift** — an event handler or prop is silently swallowed because of JavaScript's `{...rest}` spread-order semantics. The component renders, but clicks don't fire.

Both have happened in this repo. The test suite is a regression net for exactly these two classes. It is **not** a replacement for the Storybook visual matrix — if the bug is "the wrong shade of blue in hover state", the test suite won't catch it and is not expected to.

---

## Test layers

The project has two distinct test locations, each with a different job:

```
src/components/__tests__/    ← component behaviour (React DOM tests)
scripts/__tests__/           ← build pipeline correctness (Node integration tests)
```

### Layer 1 — Component tests (`src/components/__tests__/`)

**Tool:** Vitest + `@testing-library/react` + `@testing-library/user-event`

These tests render components in a real DOM (jsdom) and drive them via simulated user events. They answer: *"Does this work correctly when a real user interacts with it?"*

#### What they cover and why

**Variant matrix completeness**

Every component has a finite set of valid prop combinations (type × hierarchy × size × disabled × etc.). The test suite renders every combination in a loop and just asserts the element is in the document.

Why: if a single variant is missing from an internal lookup map (e.g. `UNCHECKED.tint` in Checkbox), the component throws during render. That crash is invisible until a user sees a blank page.

```ts
// Checkbox.test.tsx — catches missing UNCHECKED/CHECKED/DISABLED map entries
it.each(HIERARCHIES)("renders every size × state for %s", (hierarchy) => {
  for (const size of SIZES) {
    for (const state of [false, true, "indeterminate"]) {
      const { unmount } = render(<Checkbox hierarchy={hierarchy} size={size} checked={...} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      unmount();
    }
  }
});
```

**Controlled vs. uncontrolled behaviour**

Checkbox supports both patterns. The test confirms that:
- Uncontrolled: toggling updates internal state.
- Controlled: the component does NOT update until the parent changes the `checked` prop.

This distinction is easy to break accidentally during refactors.

```ts
it("stays on the controlled value until the prop changes", async () => {
  const { rerender } = render(<Checkbox checked={false} />);
  await user.click(screen.getByRole("checkbox"));
  expect(box).toHaveAttribute("aria-checked", "false"); // prop wins over click
  rerender(<Checkbox checked />);
  expect(box).toHaveAttribute("aria-checked", "true");  // prop change reflects
});
```

**Prop composition / spread-order regression**

All four button components extract specific event handlers from `...rest` before spreading the remainder onto the native element. If the order is wrong, the consumer's handler is silently overwritten.

```ts
it("consumer onMouseEnter composes with internal hover tracking", async () => {
  const consumerEnter = vi.fn();
  render(<Button onMouseEnter={consumerEnter} hierarchy="filled">Continue</Button>);
  await user.hover(screen.getByRole("button"));
  expect(consumerEnter).toHaveBeenCalledTimes(1);       // consumer called
  expect(button.style.background).toContain("var(--color-background-brand-vibrant-hover)");  // internal state also updated
});
```

**Keyboard accessibility**

Buttons and checkboxes must work via keyboard, not just mouse. Tests verify Space toggles a checkbox, and that click-via-keyboard fires the handler.

**Deprecated prop aliases**

`leftIcon` / `rightIcon` are kept for API compatibility. One test guards that the alias still works — so the migration path cannot be silently broken.

---

### Layer 2 — Pipeline tests (`scripts/__tests__/`)

**Tool:** Vitest spawning the real scripts via `execSync`, reading their output

These tests run the actual build scripts against a synthetic fixture and inspect the JSON / CSS output. They answer: *"Does the token pipeline produce the right structure?"*

#### What they cover and why

**`pipeline.test.ts` — token merge script**

Writes a synthetic `figma-raw/*.json` fixture to a temp directory, runs `build-source-tokens.ts` via `tsx`, then reads the output `tokens.json` and asserts its structure.

Why run the script rather than import a function? The script reads environment variables and file paths — the test verifies the full integration, including that env overrides work and the file is written to the right place.

Key assertions:
- All seven token categories are created (`color`, `spacing`, `sizing`, `radius`, `borderWidth`, `typography`, `shadow`).
- Figma composite strings (`Font(family: ...)`, `Effect(...)`) are **skipped** in the generic pass — if they leak through, they end up as literal CSS values and break the stylesheet.
- Dark values are attached as `darkValue` properties on the matching light token.
- Typography `textStyle` composites reference atoms via Style Dictionary reference syntax (`{typography.fontSize.label.medium.value}`) — this is what makes a change to one atom propagate everywhere.

**`style-dictionary-formats.test.ts` — CSS and Tailwind output**

Runs the real Style Dictionary build into an isolated temp directory and asserts the *shape* of the output — not byte-for-byte snapshots, which would break on every Figma sync.

The most important assertion:

```ts
it("defines every --color-* variable referenced by components and stories", () => {
  // scan all .ts/.tsx source files for --color-xxx references
  // compare against what's actually defined in variables.css
  // if any are missing → the UI would silently inherit nothing at runtime
  expect(missing).toEqual([]);
});
```

CSS custom properties fail silently. There is no TypeScript error when you reference `var(--color-nonexistent)` — the property just resolves to empty string and the element has no background or border. This test is the only automated guard against that class of bug.

---

## Tools and setup

| Package | Role |
|---|---|
| `vitest` | Test runner — native Vite/ESM integration, TypeScript-ready without extra config |
| `jsdom` | Simulated browser DOM for component tests |
| `@testing-library/react` | `render()`, `screen.getByRole()` — queries by semantic role, not CSS selectors |
| `@testing-library/user-event` | Simulates real user gestures (click, hover, keyboard) including event sequencing |
| `@testing-library/jest-dom` | Extra DOM matchers: `toBeInTheDocument()`, `toHaveAttribute()`, `toBeDisabled()` |
| `@storybook/test-runner` + `playwright` | Visits every story in a real browser; catches any story that throws during render |

**Why @testing-library over direct React enzyme / render?**

Testing Library queries by ARIA role (`getByRole("button")`, `getByRole("checkbox")`), which matches how assistive technology sees the component. This means tests fail if you accidentally remove accessibility semantics — a meaningful signal.

**Why `user-event` and not `fireEvent`?**

`userEvent.click()` fires the full sequence: `pointerover → pointerenter → mouseover → mouseenter → pointermove → mousemove → pointerdown → mousedown → pointerup → mouseup → click`. This matches what a real browser does and catches bugs in handler composition. `fireEvent.click()` fires a single synthetic event and misses many real-world scenarios.

**Setup file (`src/test/setup.ts`)**

Imports `@testing-library/jest-dom/vitest` to register DOM matchers globally, and calls `cleanup()` after every test to unmount all rendered trees and avoid state leaking between tests.

---

## Running the tests

```bash
npm test              # run all tests once (CI mode)
npm run test:watch    # watch mode for development
npm run test:stories  # Storybook test-runner (needs build-storybook first)
```

The `npm run build-storybook` step is required before `test:stories` because the runner visits the static build, not the dev server.

---

## How to write a new test

### For a new component

Create `src/components/__tests__/MyComponent.test.tsx`. Follow this structure:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "../MyComponent";

// 1. Variant matrix — one loop, all combinations
describe("variant matrix completeness", () => {
  it.each(VARIANTS)("renders %s without crashing", (variant) => {
    const { unmount } = render(<MyComponent variant={variant} />);
    expect(screen.getByRole("...")).toBeInTheDocument();
    unmount();
  });
});

// 2. Core behavior
describe("behavior", () => {
  it("does the thing when clicked", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<MyComponent onAction={handler} />);
    await user.click(screen.getByRole("..."));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

**Queries to prefer:**

| Use | Avoid | Why |
|---|---|---|
| `getByRole("button")` | `getByTestId("btn")` | Verifies semantics |
| `getByRole("checkbox")` | `querySelector("input")` | Verifies semantics |
| `getByLabelText("...")` | `getByPlaceholderText` | Matches AT traversal |

**Only add `data-testid` when there is no role or label to query by.**

### For a new pipeline script

Create `scripts/__tests__/my-script.test.ts`. The pattern:

```ts
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

let dir: string;

afterEach(() => rmSync(dir, { recursive: true, force: true }));

it("produces the expected output", () => {
  dir = mkdtempSync(join(tmpdir(), "my-test-"));
  writeFileSync(join(dir, "input.json"), JSON.stringify({ ... }));

  execSync("npx tsx scripts/my-script.ts", {
    stdio: "pipe",
    env: { ...process.env, MY_INPUT: join(dir, "input.json"), MY_OUTPUT: join(dir, "output.json") },
  });

  const result = JSON.parse(readFileSync(join(dir, "output.json"), "utf8"));
  expect(result).toMatchObject({ ... });
});
```

Always use a `tmpdir` and clean up in `afterEach`. Never write to `tokens/` or `dist/` from a test.

---

## What is deliberately NOT tested

| Not tested | Reason |
|---|---|
| Specific inline style values (e.g. exact background hex) | Storybook visual matrix is better suited |
| Generated `dist/` byte contents | Shape assertions survive Figma re-syncs; snapshots do not |
| Radix UI internals | Already tested by the Radix library upstream |
| Stories as unit tests | The Storybook test-runner covers all stories at the integration level |
| CSS-in-JS class name stability | This project uses inline styles, not class-based CSS |

**The rule:** if the bug would only be visible in a browser (wrong colour, wrong spacing), it belongs in the Storybook matrix. If the bug causes a JavaScript throw or a silent wrong value in business logic, it belongs in the unit test suite.
