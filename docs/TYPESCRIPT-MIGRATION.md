# TypeScript Migration Plan

Goal: full TypeScript coverage of the design system — components, stories,
build scripts, and tooling config — with the app runnable at every step.
Philosophy per `.opencode/skills/typescript/SKILL.md`: inference-first,
minimal hand-written types, no ceremony.

**Gate for every phase:** `npm run storybook` renders, `npx tsc --noEmit`
passes, `npm run tokens:sync` still works.

---

## Phase 0 — Foundation (1 PR, no behavior change)

- [ ] `npm i -D typescript @types/react @types/react-dom`
- [ ] Add `tsconfig.json` (see skill §1: strict, `resolveJsonModule`, `jsx: react-jsx`, `moduleResolution: bundler`)
- [ ] Add `"typecheck": "tsc --noEmit"` npm script
- [ ] Confirm zero TS errors with zero TS files (baseline)
- [ ] Storybook: nothing needed (`main.js` glob already includes tsx)

## Phase 1 — Shared modules (1 PR, lowest risk)

| File | Becomes | Notes |
|---|---|---|
| `src/components/typography.ts` | `.ts` | Type token boundary here: `keyof typeof tw.fontSize` → export `FontToken` type |
| `src/components/icons.jsx` | `.tsx` | Icon components take `SVGProps<SVGSVGElement>` |

Derive and export from `typography.ts`:
```ts
export type FontToken = keyof typeof tw.fontSize;
```

## Phase 2 — Components, leaf-first (1 PR per component, or one batch PR)

Order by dependency depth (leaf → consumers):

1. `Checkbox.tsx` — smallest state surface; establishes the component pattern:
   - `SIZES` map `as const` + `export type CheckboxSize = keyof typeof SIZES`
   - `HIERARCHIES = ["filled","tint","outline"] as const` + union type
   - Props inline object type; `forceState?: "hover" | "focused"`
2. `Button.tsx` — same pattern; add `startIcon`/`endIcon` types
3. `LinkButton.tsx`, `SocialButton.tsx` — reuse shared types
4. Extract shared prop types to `src/components/types.ts` only if ≥3
   components repeat them (don't create it speculatively)

Pattern contract (all components must end up like this):
```tsx
const SIZES = { ... } as const;
type Size = keyof typeof SIZES;
type Hierarchy = "filled" | "tint" | "outline";

export function Button({
  hierarchy = "filled",
  size = "medium",
}: {
  hierarchy?: Hierarchy;
  size?: Size;
}) { ... }
```

## Phase 3 — Stories (1 batch PR)

All 7 `stories/*.jsx` → `.tsx`. Mechanical changes only:
- Import types from components instead of re-declaring controls
- `argTypes` option arrays derive from exported unions:
  ```ts
  options: Object.values(...) // or HIERARCHIES directly
  ```
- No logic refactors in this phase — rename + type-fix only

## Phase 4 — Build scripts & tooling (2 PRs, independent)

1. `scripts/build-dark-theme.js`, `scripts/build-source-tokens.js` → `.ts`,
   run via Node 22+ native `--experimental-strip-types` **or** add `tsup`/`tsx`.
   Decision point: prefer adding `tsx` devDep (`node --import tsx`) — simplest,
   no build step for scripts. Update `package.json` scripts accordingly.
   - Type the Figma raw JSON shape loosely (`unknown` at parse boundary,
     narrow once) — these files handle external data
2. Config files: `style-dictionary.config.js`, `tailwind.config.js`,
   `postcss.config.js`, `.storybook/main.js`, `.storybook/preview.ts` → `.ts`.
   Lowest value, do last; keep `.js` if a config fights back (acceptable).

## Phase 5 — Enforcement & cleanup

- [ ] CI/pre-push gate: `npm run typecheck` + esbuild smoke on changed files
- [ ] Reviewer agent already runs `tsc --noEmit` when tsconfig exists ✓
- [ ] Delete stale `.js` originals after each rename (same commit)
- [ ] Grep gate: `git ls-files "*.jsx"` returns empty
- [ ] Update CLAUDE.md commands section with `npm run typecheck`

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| JSON imports (`dist/json/*.json`) typed too narrowly/narrowly failing | `resolveJsonModule`; wrap access in typed helpers in `typography.ts` |
| Style objects: React.CSSProperties vs CSS vars in strings | Values are strings — fine; avoid `as CSSProperties` spam, use it once where TS complains legitimately |
| Radix `checked="indeterminate"` tri-state | Type as `boolean \| "indeterminate"`, matches Radix's own API |
| Stories' dynamic args lose autocomplete | Acceptable — argTypes are runtime data; don't over-engineer |
| Script migration breaks tokens pipeline | Phase 4 is isolated; pipeline has its own verify command |

## Effort estimate

| Phase | PRs | Rough size |
|---|---|---|
| 0 Foundation | 1 | XS |
| 1 Shared modules | 1 | S |
| 2 Components | 1–5 | M |
| 3 Stories | 1 | M (mechanical) |
| 4 Scripts/config | 2 | M |
| 5 Enforcement | 1 | S |

Total: ~7 PRs, each leaving the app green. Phases are independently shippable;
nothing blocks on anything except its predecessor's numbering.
