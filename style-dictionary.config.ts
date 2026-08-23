#!/usr/bin/env node
/**
 * Style Dictionary build.
 *
 * Reads tokens/tokens.json (produced by scripts/build-source-tokens.ts from
 * the raw Figma variable dumps) and outputs:
 *
 *   dist/css/variables.css        - CSS custom properties, for any consumer
 *   dist/json/tailwind-tokens.json - a theme object consumed by tailwind.config.ts
 *                                    and the Storybook token-preview story
 *   dist/json/tokens.json          - flat JSON token map (colors, spacing, etc.)
 *
 * JSON is used (rather than a CJS .js file with module.exports) so the same
 * output can be required() from Node (tailwind.config.ts) and imported
 * natively by Vite/Storybook without any CJS/ESM interop issues.
 *
 * Run with: npm run tokens:build
 */
import StyleDictionary from "style-dictionary";

// Output root — overridable so tests can build into a temp dir instead of
// clobbering the working tree's dist/.
const DIST_DIR = process.env.TOKENS_DIST_DIR ?? "dist/";

interface SDToken {
  readonly path: readonly string[];
  readonly type?: string;
  readonly value: unknown;
  readonly darkValue?: unknown;
}

interface SDLayer {
  offsetX: unknown;
  offsetY: unknown;
  blur: unknown;
  spread: unknown;
  color: string;
}

type TokenTree = Record<string, unknown>;

const cssVarName = (token: SDToken): string => `--${token.path.join("-")}`;

const shadowLayerToCss = (layer: SDLayer): string =>
  `${layer.offsetX} ${layer.offsetY} ${layer.blur} ${layer.spread} ${layer.color}`;

// -----------------------------------------------------------------------
// Custom format: CSS custom properties
// -----------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "custom/css-variables",
  format: async ({ dictionary }) => {
    const light: string[] = [];
    const dark: string[] = [];
    for (const token of dictionary.allTokens as unknown as SDToken[]) {
      if (token.type === "typography") continue; // composite - see Tailwind output instead
      let value: string | undefined;
      if (token.type === "boxShadow") {
        const layers = (
          Array.isArray(token.value) ? token.value : [token.value]
        ) as SDLayer[];
        value = layers.map(shadowLayerToCss).join(", ");
      } else if (typeof token.value === "object" && token.value !== null) {
        continue; // skip anything else structured we don't have a CSS shape for
      } else {
        value = String(token.value);
      }
      light.push(`  ${cssVarName(token)}: ${value};`);
      if (typeof token.darkValue === "string") {
        dark.push(`  ${cssVarName(token)}: ${token.darkValue};`);
      }
    }
    let out = `:root {\n${light.join("\n")}\n}\n`;
    if (dark.length > 0) {
      out += `\n[data-theme="dark"] {\n${dark.join("\n")}\n}\n`;
    }
    return out;
  },
});

// -----------------------------------------------------------------------
// Custom format: Tailwind-consumable theme object
// -----------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "custom/tailwind-theme",
  format: async ({ dictionary }) => {
    const colors: TokenTree = {};
    const spacing: Record<string, unknown> = {};
    const borderRadius: TokenTree = {};
    const borderWidth: TokenTree = {};
    const boxShadow: Record<string, string> = {};
    const fontFamily: Record<string, unknown[]> = {};
    const fontSize: Record<string, unknown> = {};

    const setDeep = (
      root: TokenTree,
      pathParts: readonly string[],
      value: unknown
    ): void => {
      let node: TokenTree = root;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const seg = pathParts[i] ?? "";
        const existing = node[seg];
        node[seg] =
          typeof existing === "object" && existing !== null ? existing : {};
        node = node[seg] as TokenTree;
      }
      const last = pathParts[pathParts.length - 1] ?? "";
      node[last] = value;
    };

    for (const token of dictionary.allTokens as unknown as SDToken[]) {
      const [category, ...rest] = token.path;

      if (category === "color") {
        // Reference the CSS custom property so utilities follow the active
        // theme (light/dark) instead of baking in a light-mode hex value.
        setDeep(colors, rest, `var(${cssVarName(token)})`);
      } else if (category === "spacing") {
        spacing[rest[0] ?? ""] = token.value;
      } else if (category === "radius") {
        setDeep(borderRadius, rest, token.value);
      } else if (category === "borderWidth") {
        setDeep(borderWidth, rest, token.value);
      } else if (category === "shadow" && rest[rest.length - 1] === "composite") {
        const step = rest[0];
        if (!step) continue;
        const layers = (
          Array.isArray(token.value) ? token.value : [token.value]
        ) as SDLayer[];
        boxShadow[step] = layers.map(shadowLayerToCss).join(", ");
      } else if (category === "typography" && rest[0] === "fontFamily") {
        fontFamily[rest[1] ?? ""] = [token.value];
      } else if (category === "typography" && rest[0] === "textStyle") {
        const name = rest[1];
        if (!name) continue;
        const v = token.value as Record<string, unknown>;
        fontSize[name] = [
          v.fontSize,
          {
            lineHeight: v.lineHeight,
            letterSpacing: v.letterSpacing,
            fontWeight: String(v.fontWeight),
          },
        ];
      }
    }

    const theme = { colors, spacing, borderRadius, borderWidth, boxShadow, fontFamily, fontSize };
    return JSON.stringify(theme, null, 2) + "\n";
  },
});

// -----------------------------------------------------------------------
// Custom format: flat JSON token map (handy for non-Tailwind JS/TS consumers)
// -----------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "custom/flat-tokens",
  format: async ({ dictionary }) => {
    const out: Record<string, unknown> = {};
    for (const token of dictionary.allTokens as unknown as SDToken[]) {
      out[token.path.join(".")] = token.value;
    }
    return JSON.stringify(out, null, 2) + "\n";
  },
});

const sd = new StyleDictionary({
  source: ["tokens/tokens.json"],
  log: { verbosity: "verbose" },
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: `${DIST_DIR}css/`,
      files: [{ destination: "variables.css", format: "custom/css-variables" }],
    },
    tailwind: {
      buildPath: `${DIST_DIR}json/`,
      files: [{ destination: "tailwind-tokens.json", format: "custom/tailwind-theme" }],
    },
    js: {
      buildPath: `${DIST_DIR}json/`,
      files: [{ destination: "tokens.json", format: "custom/flat-tokens" }],
    },
  },
});

sd.buildAllPlatforms();
