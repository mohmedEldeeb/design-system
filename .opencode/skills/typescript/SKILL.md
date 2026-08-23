---
name: typescript
description: Pragmatic TypeScript conventions and migration steps for this design system. Use when creating .ts/.tsx files, converting JSX components to TSX, adding prop types, or wiring up tsconfig/build tooling.
---

# TypeScript in the design system

Philosophy: **type like a pragmatic human engineer, not a type-golf champion.**
Types exist to catch real bugs and document intent — not to satisfy a compiler
ritual. If inference gives you the type for free, do not write it down.

## 1. Setup (do this once when migrating)

```bash
npm i -D typescript @types/react @types/react-dom
```

Minimal `tsconfig.json` for this repo (Vite + Storybook 8 handle TS natively;
`.storybook/main.js` already globs `*.tsx`):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "stories", ".storybook"]
}
```

- `strict: true` from day one — retrofitting strictness is misery.
- Do NOT add path aliases unless the team actually asks for them.
- Verify with `npx tsc --noEmit`.

## 2. Reduce types: the inference-first rules

1. **Never annotate what the compiler infers.**
   ```ts   // ❌ noise
   const size: string = "medium";
   const sizes = ["small", "medium"];            // ✅ inferred
   ```
2. **Derive unions from data, don't hand-write them** — one source of truth:
   ```tsx
   const SIZES = {
     small:  { box: 12, radius: 4, icon: 8 },
     medium: { box: 16, radius: 4, icon: 12 },
     large:  { box: 20, radius: 6, icon: 16 },
   } as const;

   type Size = keyof typeof SIZES;        // "small" | "medium" | "large"
   type Hierarchy = "filled" | "tint" | "outline";
   ```
3. **Props: one inline object type, only what's used.** No `interface IButtonProps`
   ceremony, no extending `HTMLAttributes` unless forwarding is real:
   ```tsx
   export function Button({
     hierarchy = "filled",
     size = "medium",
     startIcon,
     endIcon,
     disabled = false,
     onCheckedChange,
   }: {
     hierarchy?: Hierarchy;
     size?: Size;
     startIcon?: ReactNode;
     endIcon?: ReactNode;
     disabled?: boolean;
     onClick?: () => void;
   }) { ... }
   ```
4. **`satisfies` beats annotation** — keeps the narrow literal types while
   validating shape:
   ```ts
   const VARIANTS = { filled: {...}, tint: {...} } satisfies Record<Hierarchy, Variant>;
   ```
5. **Type the token boundary once**, then let everything flow from it:
   ```ts
   import tw from "../dist/json/tailwind-tokens.json";
   type FontToken = keyof typeof tw.fontSize;   // autocomplete for "label-medium-medium"
   const s = SIZES[size];                       // ✅ typed, no assertion needed
   ```
6. **No `enum`s** — use `as const` objects or union literals.
7. **No `any`. At true unknowns use `unknown`** and narrow at the boundary
   (event handlers, JSON parsing). One narrow cast with a comment beats ten
   workarounds — but casts need justification.
8. **No non-null `!` assertions** unless you can explain why it cannot be null
   in one sentence. Prefer early return / optional chaining.
9. **Event handlers**: type by usage, not ceremony:
   ```tsx
   onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}  // inline param
   ```
10. **Generics only when a caller needs to control a type.** No generic
    components in this codebase today — don't introduce them speculatively.
11. **Utility types you'll actually reach for:** `Pick`, `Partial`,
    `Record<K, V>`, `ReturnType<T>`, `keyof typeof`. Skip fancy conditional/
    mapped gymnastics — unreadable types are a bug magnet.

## 3. Migration order (smallest blast radius first)

1. `tsconfig.json` + devDeps → run `npx tsc --noEmit` green on zero TS files.
2. Rename shared leaf modules: `typography.js` → `typography.ts`.
3. Rename one component at a time (`Checkbox.jsx` → `Checkbox.tsx`),
   fix imports, re-run `tsc --noEmit` after each.
4. Stories last (`*.stories.tsx`) — they consume finished components.
5. Keep `.storybook/main.js` glob as-is (already includes tsx); esbuild checks
   become: `npx esbuild <changed .tsx files> --outdir=/tmp/check` (esbuild reads
   TS natively, drop the `--loader:.jsx=jsx` flag for .tsx).

## 4. Review gates for TS changes

- `npx tsc --noEmit` must pass before any TS PR merges (add it as the lint gate).
- New files are `.ts`/`.tsx`; do not mix new TS into old `.jsx` files.
- A PR that adds >30% type-code vs runtime-code lines gets flagged for
  over-typing — same behavior, less ceremony, please.
