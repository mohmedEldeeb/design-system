import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// Runs the real script via tsx against a synthetic figma-raw fixture —
// exercises the pipeline end-to-end without touching tokens/.
let dir: string;

function runScript(files: Record<string, unknown>, dark?: Record<string, string>): Record<string, unknown> {
  dir = mkdtempSync(join(tmpdir(), "tokens-test-"));
  const rawDir = join(dir, "figma-raw");
  mkdirSync(rawDir);
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(rawDir, name), JSON.stringify(content));
  }
  const outFile = join(dir, "tokens.json");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    TOKENS_RAW_DIR: rawDir,
    TOKENS_OUT_FILE: outFile,
  };
  if (dark) {
    const darkFile = join(dir, "dark-theme.json");
    writeFileSync(darkFile, JSON.stringify(dark));
    env.TOKENS_DARK_FILE = darkFile;
  }
  execSync("npx tsx scripts/build-source-tokens.ts", { env, stdio: "pipe" });
  return JSON.parse(readFileSync(outFile, "utf8")) as any;
}

const FIXTURE = {
  "bg/brand/vibrant/default": "#274DFF",
  "text/neutral/primary": "#050505",
  "gap/1_5rem (24px)": "24",
  "size/icon/small (16px)": "16",
  "components/button": "8",
  "button/border/width/medium": "1",
  "type/family/label": "Plus Jakarta Sans",
  "type/size/label/medium": "14",
  "type/weight/label/medium": "500",
  "type/line-height/label/medium": "20",
  "letter-spacing/14": "-0.1",
  // composite Figma debug strings must be skipped in the generic pass
  "typography/composite": "Font(family: Plus Jakarta Sans, style: Medium)",
  "elevation/shadow/4xs/layer-0/color": "rgba(0, 0, 0, 0.12)",
  "elevation/shadow/4xs/layer-0/offset-x": "0",
};

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("build-source-tokens pipeline", () => {
  it("creates all seven categories with correct dot-paths", () => {
    const t: any = runScript({ "raw.json": FIXTURE }) as any;
    for (const category of ["color", "spacing", "sizing", "radius", "borderWidth", "typography", "shadow"]) {
      expect(t).toHaveProperty(category);
    }
    expect(t.color.background.brand.vibrant.default.value).toBe("#274DFF");
    expect(t.color.text.neutral.primary.value).toBe("#050505");
    expect(t.spacing["24"].value).toBe("24px");
    expect(t.sizing["16"].value).toBe("16px");
    expect(t.radius.components.button.value).toBe("8px");
    expect(t.borderWidth.button.medium.value).toBe("1px");
  });

  it("skips composite Font()/Effect() strings in the generic pass", () => {
    const t: any = runScript({ "raw.json": FIXTURE });
    // The composite string must not leak anywhere as a literal value
    expect(JSON.stringify(t)).not.toContain("Font(family:");
    // but its color-less key must not create a color token either
    expect(t.color.typography).toBeUndefined();
  });

  it("attaches dark values as darkValue on matching color tokens", () => {
    const t: any = runScript(
      { "raw.json": { "bg/error/vibrant/default": "#ff3b30" } },
      { "color.background.error.vibrant.default": "#ff5c52" }
    );
    expect(t.color.background.error.vibrant.default.darkValue).toBe("#ff5c52");
  });

  it("builds typography atoms and textStyle composites referencing them", () => {
    const t: any = runScript({ "raw.json": FIXTURE });
    expect(t.typography.fontFamily.label.value).toBe("Plus Jakarta Sans");
    expect(t.typography.fontSize.label.medium.value).toBe("14px");
    expect(t.typography.fontWeight.label.medium.value).toBe(500);
    const composite = t.typography.textStyle["label-medium-medium"];
    expect(composite.type).toBe("typography");
    expect(composite.value.fontSize).toBe("{typography.fontSize.label.medium.value}");
  });
});

describe("build-dark-theme heuristics", () => {
  function runDark(input: Record<string, string>, _anchors?: boolean) {
    dir = mkdtempSync(join(tmpdir(), "tokens-dark-"));
    const flatFile = join(dir, "flat.json");
    writeFileSync(flatFile, JSON.stringify(input));
    const outFile = join(dir, "dark-out.json");
    execSync("npx tsx scripts/build-dark-theme.ts", {
      stdio: "pipe",
      env: {
        ...process.env,
        TOKENS_FLAT_FILE: flatFile,
        TOKENS_DARK_OUT: outFile,
      },
    });
    return JSON.parse(readFileSync(outFile, "utf8")) as any;
  }

  it("inverts lightness for neutral surface colors", () => {
    const out = runDark({ "color.background.surface.primary": "#ffffff" });
    // white → dark anchor-ish value, definitely not still white
    expect(out["color.background.surface.primary"]).not.toBe("#ffffff");
    const hex = out["color.background.surface.primary"];
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("keeps disabled tokens unchanged", () => {
    const out = runDark({ "color.background.fill.secondary.disabled": "#ebebeb" });
    expect(out["color.background.fill.secondary.disabled"]).toBe("#ebebeb");
  });

  it("keeps inverted (dark-context) tokens unchanged", () => {
    const out = runDark({ "color.background.fill.inverted.default": "#141414" });
    expect(out["color.background.fill.inverted.default"]).toBe("#141414");
  });

  it("applies known accent anchors exactly", () => {
    const out = runDark({ "color.background.brand.vibrant.default": "#274dff" });
    expect(out["color.background.brand.vibrant.default"]).toBe("#6b8dff");
  });
});
