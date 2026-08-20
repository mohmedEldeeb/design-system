#!/usr/bin/env node
/**
 * Style Dictionary build.
 *
 * Reads tokens/tokens.json (produced by scripts/build-source-tokens.js from
 * the raw Figma variable dumps) and outputs:
 *
 *   dist/css/variables.css        - CSS custom properties, for any consumer
 *   dist/json/tailwind-tokens.json - a theme object consumed by tailwind.config.js
 *                                    and the Storybook token-preview story
 *   dist/json/tokens.json          - flat JSON token map (colors, spacing, etc.)
 *
 * JSON is used (rather than a CJS .js file with module.exports) so the same
 * output can be required() from Node (tailwind.config.js) and imported
 * natively by Vite/Storybook without any CJS/ESM interop issues.
 *
 * Run with: npm run tokens:build
 */
const StyleDictionary = require("style-dictionary").default;

function cssVarName(token) {
  return `--${token.path.join("-")}`;
}

function shadowLayerToCss(layer) {
  return `${layer.offsetX} ${layer.offsetY} ${layer.blur} ${layer.spread} ${layer.color}`;
}

// -----------------------------------------------------------------------
// Custom format: CSS custom properties
// -----------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "custom/css-variables",
  format: async ({ dictionary }) => {
    const lines = [];
    for (const token of dictionary.allTokens) {
      if (token.type === "typography") continue; // composite - see Tailwind output instead
      let value;
      if (token.type === "boxShadow") {
        const layers = Array.isArray(token.value) ? token.value : [token.value];
        value = layers.map(shadowLayerToCss).join(", ");
      } else if (typeof token.value === "object") {
        continue; // skip anything else structured we don't have a CSS shape for
      } else {
        value = token.value;
      }
      lines.push(`  ${cssVarName(token)}: ${value};`);
    }
    return `:root {\n${lines.join("\n")}\n}\n`;
  },
});

// -----------------------------------------------------------------------
// Custom format: Tailwind-consumable theme object
// -----------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: "custom/tailwind-theme",
  format: async ({ dictionary }) => {
    const colors = {};
    const spacing = {};
    const borderRadius = {};
    const borderWidth = {};
    const boxShadow = {};
    const fontFamily = {};
    const fontSize = {};

    const setDeep = (root, pathParts, value) => {
      let node = root;
      for (let i = 0; i < pathParts.length - 1; i++) {
        node[pathParts[i]] = node[pathParts[i]] || {};
        node = node[pathParts[i]];
      }
      node[pathParts[pathParts.length - 1]] = value;
    };

    for (const token of dictionary.allTokens) {
      const [category, ...rest] = token.path;

      if (category === "color") {
        setDeep(colors, rest, token.value);
      } else if (category === "spacing") {
        spacing[rest[0]] = token.value;
      } else if (category === "radius") {
        setDeep(borderRadius, rest, token.value);
      } else if (category === "borderWidth") {
        setDeep(borderWidth, rest, token.value);
      } else if (category === "shadow" && rest[rest.length - 1] === "composite") {
        const step = rest[0];
        const layers = Array.isArray(token.value) ? token.value : [token.value];
        boxShadow[step] = layers.map(shadowLayerToCss).join(", ");
      } else if (category === "typography" && rest[0] === "fontFamily") {
        fontFamily[rest[1]] = [token.value];
      } else if (category === "typography" && rest[0] === "textStyle") {
        const name = rest[1];
        const v = token.value;
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
    const out = {};
    for (const token of dictionary.allTokens) {
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
      buildPath: "dist/css/",
      files: [{ destination: "variables.css", format: "custom/css-variables" }],
    },
    tailwind: {
      buildPath: "dist/json/",
      files: [{ destination: "tailwind-tokens.json", format: "custom/tailwind-theme" }],
    },
    js: {
      buildPath: "dist/json/",
      files: [{ destination: "tokens.json", format: "custom/flat-tokens" }],
    },
  },
});

sd.buildAllPlatforms();
