import React from "react";
import type { CSSProperties } from "react";
import { action } from "@storybook/addon-actions";
import tailwindTokens from "../dist/json/tailwind-tokens.json";
import flatTokens from "../dist/json/tokens.json";

const CATEGORY_META = {
  text: { prefix: "text", tailwind: "text", description: "Text color tokens — applied via text-{token}" },
  icon: { prefix: "icon", tailwind: "text", description: "Icon color tokens — applied via text-{token} on SVGs" },
  border: { prefix: "border", tailwind: "border", description: "Border color tokens — applied via border-{token}" },
  background: { prefix: "background", tailwind: "bg", description: "Background color tokens — applied via bg-{token}" },
} as const;

type Category = keyof typeof CATEGORY_META;

interface FlatColor {
  name: string;
  value: string;
  hex: unknown;
  category: string;
}

// Only color.* keys are looked up here; values are hex strings.
const flatTokenMap = flatTokens as unknown as Record<string, string>;
const colorsGrouped = tailwindTokens.colors as unknown as Record<Category, Record<string, unknown>>;

function flattenColors(obj: Record<string, unknown>, category: Category, prefix: string[] = []): FlatColor[] {
  const out: FlatColor[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (typeof value === "string") {
      const name = path.join("-");
      out.push({ name, value, hex: flatTokenMap[`color.${name}`], category });
    } else {
      out.push(...flattenColors(value as Record<string, unknown>, category, path));
    }
  }
  return out;
}

function SwatchGrid({ colors }: { colors: FlatColor[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
      {colors.map((c) => (
        <div
          key={c.name}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ height: "64px", background: c.value, borderBottom: "1px solid #e0e0e0" }} />
          <div style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, wordBreak: "break-word", lineHeight: 1.4 }}>{c.name}</div>
            <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>
              {String(c.hex)} <span style={{ opacity: 0.7 }}>(light)</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsageSection() {
  const demo = {
    token: "surface.primary",
    hex: "#ffffff",
    cssVar: "--color-background-surface-primary",
    twClass: "bg-background-surface-primary",
    flatKey: "color.background.surface.primary",
  };
  const codeStyle: CSSProperties = {
    background: "#f6f8fa",
    border: "1px solid #e4e7eb",
    borderRadius: "8px",
    padding: "14px 16px",
    font: '12px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace',
    overflowX: "auto",
    whiteSpace: "pre",
    margin: 0,
  };
  return (
    <section style={sectionStyle}>
      <div style={headingStyle}>Usage</div>
      <p style={{ ...bodyStyle, marginBottom: "20px" }}>
        Every color token is available three ways: as a Tailwind class, a CSS custom property, and a flat JS key.
        Example with <code>{demo.token}</code>:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <div>
          <div style={subheadingStyle}>Tailwind class</div>
          <pre style={codeStyle}>{`<button className="${demo.twClass} …">
  Button
</button>`}</pre>
        </div>
        <div>
          <div style={subheadingStyle}>CSS custom property</div>
          <pre style={codeStyle}>{`.card {
  background: var(${demo.cssVar});
}`}</pre>
        </div>
        <div>
          <div style={subheadingStyle}>JS (flat token map)</div>
          <pre style={codeStyle}>{`import tokens from "@design-system/dist/json/tokens.json";

const surface = tokens["${demo.flatKey}"];`}</pre>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
        <button
          style={{
            background: `var(${demo.cssVar})`,
            color: "var(--color-text-neutral-primary)",
            border: "1px solid var(--color-border-fill-secondary-default)",
            borderRadius: "8px",
            padding: "10px 20px",
            font: "500 14px/1.4 system-ui, sans-serif",
          }}
        >
          bg-background-surface-primary
        </button>
        <button
          style={{
            background: "#274dff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            font: "500 14px/1.4 system-ui, sans-serif",
          }}
        >
          bg-background-brand-vibrant-default
        </button>
      </div>
    </section>
  );
}

const sectionStyle = { marginBottom: "40px" };
const headingStyle = { font: "600 18px/1.4 system-ui, sans-serif", marginBottom: "12px" };
const bodyStyle = { font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.7 };
const subheadingStyle = { font: "600 13px/1.4 system-ui, sans-serif", margin: "0 0 8px", opacity: 0.7 };

function ColorsPage() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "1280px" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Colors</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "32px" }}>
        All color tokens generated from Figma variables. Re-run <code>npm run tokens:sync</code> after updating Figma
        to refresh this preview.
      </p>

      <UsageSection />

      {categories.map((category) => {
        const meta = CATEGORY_META[category];
        const colors = flattenColors(tailwindTokens.colors[category], category);
        return (
          <section key={category} style={{ marginBottom: "48px" }}>
            <h2 style={{ font: "600 18px/1.4 system-ui, sans-serif", margin: "0 0 2px", textTransform: "capitalize" }}>
              {category}
            </h2>
            <p style={{ font: "400 13px/1.5 system-ui, sans-serif", opacity: 0.55, margin: "0 0 12px" }}>
              {meta.description} · Tailwind prefix:{" "}
              <code>
                {meta.tailwind}-{category}-…
              </code>
            </p>
            <SwatchGrid colors={colors} />
          </section>
        );
      })}
    </div>
  );
}

export default {
  title: "Foundations/Colors",
  component: ColorsPage,
  parameters: { layout: "fullscreen" },
};

export const AllColors = {};

// ---------------------------------------------------------------------------
// Interactive playground — Controls + Actions
// ---------------------------------------------------------------------------
const categories = (Object.keys(CATEGORY_META) as Category[]).filter(
  (c) => colorsGrouped[c]
);

const ALL_COLORS = categories.flatMap((category) =>
  flattenColors(colorsGrouped[category], category).map((c) => ({
    ...c,
    cssVar: `--color-${c.name}`,
    twClass: `${CATEGORY_META[category].tailwind}-${c.name}`,
    flatKey: `color.${c.name}`,
  }))
);
const COLOR_OPTIONS = ALL_COLORS.map((c) => c.name);

function ColorPlayground({
  colorToken,
  label,
  onClick,
}: {
  colorToken?: string;
  label?: string;
  onClick?: () => void;
}) {
  const fallback = ALL_COLORS[0];
  if (!fallback) return null;
  const token = ALL_COLORS.find((c) => c.name === colorToken) ?? fallback;

  const [size, opts] = tailwindTokens.fontSize[
    "label-medium-medium"
  ] as unknown as [string, { lineHeight: string }];
  return (
    <div style={{ padding: "32px", fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
          borderRadius: "12px",
          background: `var(${token.cssVar})`,
          border: "1px solid #e0e0e0",
        }}
      >
        <span style={{ font: `500 ${size} ${opts.lineHeight} system-ui, sans-serif` }}>
          {label}
        </span>
        <button
          onClick={onClick}
          style={{
            background: "#274dff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            font: "500 14px/1.4 system-ui, sans-serif",
            cursor: "pointer",
          }}
        >
          Click me (see Actions tab)
        </button>
      </div>

      <div style={{ marginTop: "24px", fontSize: "13px", lineHeight: 1.8 }}>
        <div>
          <strong>Tailwind:</strong> <code>{token.twClass}</code>
        </div>
        <div>
          <strong>CSS var:</strong> <code>var({token.cssVar})</code>
        </div>
        <div>
          <strong>JS key:</strong> <code>{token.flatKey}</code>
        </div>
        <div>
          <strong>Value:</strong> <code>{token.value}</code>
        </div>
      </div>
    </div>
  );
}

export const Playground = {
  args: {
    colorToken: "background-surface-subtle",
    label: "Playground surface",
  },
  argTypes: {
    colorToken: {
      control: "select",
      options: COLOR_OPTIONS,
      description: "Any of the generated color tokens",
    },
    label: { control: "text" },
  },
  render: (args: { colorToken?: string; label?: string }) => (
    <ColorPlayground
      colorToken={args.colorToken}
      label={args.label}
      onClick={action("playground-click")}
    />
  ),
};
