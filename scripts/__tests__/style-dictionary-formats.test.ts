import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Build into an isolated dir so the test never touches the real dist/.
const outDir = mkdtempSync(join(tmpdir(), "sd-format-test-"));

// Shape assertions on generated output — deliberately NOT byte snapshots so
// they survive Figma re-syncs. Runs the real build first.

let css: string;
let tailwindTokens: Record<string, unknown>;

beforeAll(() => {
  execSync("npx tsx style-dictionary.config.ts", {
    stdio: "pipe",
    env: { ...process.env, TOKENS_DIST_DIR: `${outDir}/` },
  });
  css = readFileSync(join(outDir, "css", "variables.css"), "utf8");
  tailwindTokens = JSON.parse(readFileSync(join(outDir, "json", "tailwind-tokens.json"), "utf8"));
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe("CSS custom properties output", () => {
  it("defines every --color-* variable referenced by components and stories", () => {
    const defined = new Set([...css.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
    const referenced = new Set<string>();
    const scan = (dir: string) => {
      for (const f of readdirSync(dir, { recursive: true }) as string[]) {
        if (!/\.(tsx|ts)$/.test(f) || f.includes("__tests__")) continue;
        const content = readFileSync(join(dir, f), "utf8");
        for (const m of content.matchAll(/--color-[\w-]+/g)) referenced.add(m[0]);
      }
    };
    scan("src");
    scan("stories");

    const missing = [...referenced].filter((v) => !defined.has(v));
    // undefined CSS vars fail silently at runtime — this is the guard
    expect(missing).toEqual([]);
  });

  it("has a light :root block", () => {
    expect(css).toMatch(/:root\s*\{/);
  });
});

describe("tailwind theme object", () => {
  const THEME_KEYS = [
    "colors",
    "spacing",
    "borderRadius",
    "borderWidth",
    "boxShadow",
    "fontFamily",
    "fontSize",
  ] as const;

  it.each(THEME_KEYS)("theme key %s is present and non-empty", (key) => {
    expect(Object.keys(tailwindTokens[key] as object).length).toBeGreaterThan(0);
  });

  it("colors reference CSS variables, not baked hex values", () => {
    const colors = tailwindTokens.colors as unknown;
    // walk to the first string leaf — colors is a nested tree
    let node: unknown = colors;
    while (typeof node === "object" && node !== null) {
      node = Object.values(node)[0];
    }
    expect(typeof node).toBe("string");
    expect(node as string).toMatch(/^var\(--color-/);
  });

  it("fontSize entries are [size, options] tuples with all metadata", () => {
    const fontSize = tailwindTokens.fontSize as Record<string, unknown[]>;
    for (const entry of Object.values(fontSize)) {
      expect(Array.isArray(entry)).toBe(true);
      const [size, opts] = entry as [string, Record<string, string>];
      expect(size).toMatch(/px$/);
      expect(opts).toHaveProperty("lineHeight");
      expect(opts).toHaveProperty("letterSpacing");
      expect(opts).toHaveProperty("fontWeight");
    }
  });

  it("fontFamily values are single-element arrays", () => {
    const families = tailwindTokens.fontFamily as Record<string, string[]>;
    for (const value of Object.values(families)) {
      expect(Array.isArray(value)).toBe(true);
      expect(value.length).toBe(1);
    }
  });
});
