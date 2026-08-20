# Day-to-day workflow

Quick reference for the two things you'll actually do: sync tokens after a
Figma change, and run the project locally. Full architecture details are in
`README.md` / `CLAUDE.md` — this is the "what do I type" version.

## First time only

```bash
cd /Volumes/BasharSoft/design-system
npm install
```

## 1. Preview the current tokens

```bash
npm run storybook
```

Opens http://localhost:6006 → **Foundations / Design Tokens**. This renders
every color, spacing step, radius, shadow, and text style currently in
`dist/json/tailwind-tokens.json`. This is your main "did the sync work"
check — always look here after step 2 below.

Stop the dev server with `Ctrl+C` when you're done.

## 2. Sync new/changed tokens from Figma

Whenever colors, spacing, radii, or type styles change in Figma:

1. **In Figma**, open the file and select the frame/section that holds the
   variables you changed (the "✦ Color Tokens" page, or wherever new ones
   live). The Figma MCP connector needs an active selection to read from.
2. **Ask Claude** (in a Cowork/Claude Code session with the Figma connector)
   to pull the updated variables and save them into
   `tokens/figma-raw/<some-name>.json` — either overwrite an existing file
   in that folder or add a new one. Any `.json` file dropped in
   `tokens/figma-raw/` gets picked up automatically.
3. **Rebuild everything:**
   ```bash
   npm run tokens:sync
   ```
   This runs two steps back to back:
   - `tokens:from-figma` — merges `tokens/figma-raw/*.json` into the
     categorized `tokens/tokens.json`
   - `tokens:build` — runs Style Dictionary, regenerating:
     - `dist/css/variables.css`
     - `dist/json/tailwind-tokens.json` (what `tailwind.config.js` reads)
     - `dist/json/tokens.json`
4. **Check it in Storybook** (step 1 above) — reload the page, confirm the
   new/changed tokens look right.
5. **Commit:**
   ```bash
   git add tokens/ dist/
   git commit -m "Sync tokens from Figma"
   ```

You can also just ask Claude to do steps 2–5 directly on your device — it
has the path and can run the same commands.

## 3. Using the tokens in code (once components exist)

Nothing to run — just import as usual:

- **Tailwind classes** — available anywhere `tailwind.config.js` applies,
  e.g. `className="bg-background-brand-vibrant-default text-text-on-brand-primary rounded-components-lg"`
- **CSS variables** — `var(--color-background-brand-vibrant-default)` after
  importing `dist/css/variables.css`
- **Raw values in JS/TS** — `import tokens from "./dist/json/tokens.json"`

## 4. Building a static Storybook (for sharing/deploying)

```bash
npm run build-storybook
```

Outputs a static site to `storybook-static/` — drag that folder onto
Netlify/Vercel/GitHub Pages, or open `storybook-static/index.html` locally,
to share the token reference with anyone without them running `npm install`.

## Command cheat sheet

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (first time / after pulling changes) |
| `npm run storybook` | Start the local token preview at localhost:6006 |
| `npm run tokens:sync` | Rebuild everything after updating `tokens/figma-raw/*.json` |
| `npm run tokens:from-figma` | Just the merge step (rarely needed alone) |
| `npm run tokens:build` | Just the Style Dictionary build step (rarely needed alone) |
| `npm run build-storybook` | Produce a static, shareable Storybook site |

## Saved Claude workflow: `figma-token-sync`

For when you want Claude to run the whole sync-and-verify cycle instead of
doing it by hand: `.claude/workflows/figma-token-sync.js` is a saved
[Workflow](https://docs.claude.com) script with three phases:

1. **Fetch from Figma** — pulls raw variable definitions for whichever
   Figma node IDs you pass in, and writes them into `tokens/figma-raw/`
   (skipped if you don't pass any nodes).
2. **Build** — runs `npm run tokens:sync`, fixing obviously-malformed JSON
   if the build fails.
3. **Verify** — builds Storybook, screenshots the "Design Tokens" story,
   and checks for a rendered error banner before reporting pass/fail.

### How to run it

Open a Claude / Cowork session with this project (and the Figma connector,
if you're pulling new nodes) and ask directly, e.g.:

> Run the figma-token-sync workflow — pull nodeId 12502:30000 from Figma
> into tokens/figma-raw/badge-color-tokens.json, then rebuild and verify.

Or, to just rebuild + verify whatever is already sitting in
`tokens/figma-raw/` (no Figma fetch):

> Run the figma-token-sync workflow with no nodes — just rebuild and verify.

Claude resolves this by name from `.claude/workflows/` if it's running with
this project as its working directory; if not (e.g. a fresh cloud session),
point it at the file directly: "run the workflow at
`.claude/workflows/figma-token-sync.js`". Under the hood this calls the
`Workflow` tool with:

```js
Workflow({
  scriptPath: ".claude/workflows/figma-token-sync.js", // or name: "figma-token-sync"
  args: {
    nodes: [{ nodeId: "12502:30000", label: "badge-color-tokens" }],
    // fileKey defaults to this project's Figma file — only pass it to override
  },
})
```

Each run spawns a few sub-agents (one per phase) and reports back a
summary per phase — you'll see progress in `/workflows` while it's running.
It doesn't commit anything for you; review `git diff` and commit yourself
once you're happy with the result.
