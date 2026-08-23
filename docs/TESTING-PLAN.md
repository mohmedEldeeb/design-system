# Unit Testing Plan

Goal: a small, high-signal test suite that catches the bug classes this repo
has actually hit — variant-map crashes, broken state handling, pipeline
regressions — without duplicating what the Storybook QA matrix already shows
visually.

**Philosophy:** test behavior through the DOM (user events), never snapshot
styles. If a test would just re-assert inline style values, it belongs in the
Storybook matrix instead.

---

## Stack (all devDependencies)

| Package | Role |
|---|---|
| `vitest` | Test runner (native Vite integration, TS-ready) |
| `jsdom` | DOM environment |
| `@testing-library/react` | Render + queries |
| `@testing-library/user-event` | Real interaction (click/keyboard) |
| `@testing-library/jest-dom` | DOM matchers (toBeDisabled, …) |
| `@storybook/test-runner` + `playwright` | Visits every story; catches render crashes suite-wide |

Skipped deliberately: Jest (conflicts with ESM/tsx setup), Storybook
snapshot addon, visual regression tools (Chromatic etc.) — revisit if pixel
drift becomes a real problem.

## File layout

src/components/__tests__/
  Checkbox.test.tsx                  ← matrix + behavior
  Button.test.tsx                    ← variant smoke + interactions
  typography.test.ts                 ← fontStack/fontStyle contracts
scripts/__tests__/
  build-source-tokens.test.ts        ← pipeline fixture test
  build-dark-theme.test.ts           ← heuristic anchors
  style-dictionary-formats.test.ts   ← custom format outputs
```

---

## Phase 0 — Foundation (1 PR)

- [ ] Install devDeps (table above)
- [ ] `vitest.config.ts`: `environment: "jsdom"`, `setupFiles: ["src/test/setup.ts"]`, `globals: true`
- [ ] `npm test` script (`vitest run`), `npm run test:watch`, `test:stories` (`test-storybook`)
- [ ] One trivial sanity test passing (e.g. typography `fontStack()` returns fallbacks)
- [ ] CI: add `npm test` step after typecheck in `.github/workflows/ci.yml`

## Phase 1 — Checkbox tests (highest value, 1 PR)

`Checkbox.test.tsx` — the regression net:

1. **Variant matrix completeness** (would have caught `UNCHECKED.tint` crash):
   ```ts
   it.each(hierarchies)("renders ${hierarchy} × ${size} × unchecked/checked/indeterminate", ...)
   ```
   Render every combination (incl. disabled), assert the box is in the document.
   ~27 renders, one loop — no per-combo hand-written tests.
2. **Toggle behavior**: click toggles uncontrolled; controlled mode does NOT
   change until prop changes (would have caught the Playground bug).
3. **Indeterminate → click → checked** (Radix coercion contract).
4. **Disabled ignores clicks** and shows disabled styling hook.
5. **Keyboard**: space toggles; focus ring applies on keyboard focus.
6. **Prop forwarding**: `id` / `aria-label` / `data-*` land on the root
   (guards the forwarding we just fixed).
7. **onCheckedChange** receives `boolean | "indeterminate"`.

## Phase 2 — Button / LinkButton / SocialButton (1 PR)

- Variant smoke render loop (type × hierarchy × size × fab × disabled) — no crash.
- Click fires handler; disabled does not.
- startIcon/endIcon (and deprecated aliases) render exactly two icon slots.
- Consumer handlers compose: passing `onMouseEnter` still triggers internal
  hover state (guards the spread-order fix).
- Consumer `style` merges without destroying background/border.

## Phase 3 — Token pipeline + typography tests (1 PR)

- Fixture-based: write a tiny synthetic `figma-raw/*.json` to a tmp dir,
  run the merge logic, assert:
  - categories created (color/spacing/radius/…), dot-paths correct
  - composite `Font(...)`/`Effect(...)` strings skipped in generic pass
  - dark values attach as `darkValue`
  - unknown typography token throws (typography.ts contract)
- Refactor note: extract pure functions from `build-source-tokens.ts`
  (merge/flatten/setToken already are) so tests import them directly instead
  of spawning the CLI. No behavior change.

### typography.test.ts
- `fontStack()` includes Arabic-capable fallbacks (RTL contract)
- `fontStyle("label-medium-medium")` returns size/lineHeight/weight from tokens
- `fontStyle()` with an invalid token → compile error (type test) / throws at runtime guard

### style-dictionary-formats.test.ts
- Run `npm run tokens:build`, then assert on generated output **shape**:
  - every `--color-*` var referenced by components exists (guards silent undefined vars)
  - `tailwind-tokens.json` has all 7 theme keys non-empty; fontSize entries are `[size, {lineHeight, letterSpacing, fontWeight}]` tuples
  - dark block emitted only when `darkValue`s exist
- These are shape assertions, not byte snapshots — they survive Figma re-syncs.

## Phase 4 — Storybook test-runner (1 PR)

- [ ] Add `test:stories` (`test-storybook`) against a built Storybook or dev server
- [ ] CI job: build-storybook → run test-runner (catches ANY story crash automatically)
- [ ] Optional, later: play functions on the Checkbox matrix story
      (click-through assertions) + axe-core scan

---

## What NOT to test

- Inline style values per state (visual QA = Storybook matrix)
- Generated `dist/**` contents byte-for-byte (pipeline tests assert shape, not bytes)
- Radix internals (already tested upstream)
- Stories themselves via unit tests (Phase 4 covers them wholesale)

## Effort estimate

| Phase | PRs | Tests | Value |
|---|---|---|---|
| 0 Foundation | 1 | 1 sanity | gate wired |
| 1 Checkbox | 1 | ~12 | catches our real historical bugs |
| 2 Buttons | 1 | ~10 | guards interactions/spread fixes |
| 3 Pipeline + typography + SD formats | 1 | ~15 | silent-breakage insurance, full source coverage |
| 4 Story runner | 1 | all stories | whole-suite crash net |

Total: ~5 PRs, ~38 focused tests. With Phase 3's additions every source file
under `src/` and `scripts/` is covered either directly or transitively;
`.storybook/preview.ts` and configs are exercised by the test-runner and
pipeline tests respectively.
