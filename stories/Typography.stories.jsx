import React from "react";
import tailwindTokens from "../dist/json/tailwind-tokens.json";

const CATEGORY_ORDER = ["display", "heading", "subheading", "label", "paragraph", "code"];

const CATEGORY_DESCRIPTIONS = {
  display: "Large, bold text for hero sections and major headings",
  heading: "Standard headings for sections and content hierarchy",
  subheading: "Secondary headings and subheadings",
  label: "UI labels, buttons, and form elements",
  paragraph: "Body text and content reading",
  code: "Monospace text for code and technical content",
};

function groupByCategory(fontSize) {
  const groups = {};
  for (const [name, [size, opts]] of Object.entries(fontSize)) {
    const category = name.split("-")[0];
    groups[category] = groups[category] || [];
    groups[category].push({ tokenName: name, size, opts });
  }
  return groups;
}

function SpecimenRow({ family, tokenName, size, opts }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "24px",
        padding: "16px 0",
        borderBottom: "1px solid #ececec",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: "260px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "11px",
          lineHeight: 1.5,
          opacity: 0.6,
          wordBreak: "break-word",
        }}
      >
        <div style={{ fontWeight: 600, opacity: 1, color: "#111" }}>{tokenName}</div>
        <div>
          {size} / {opts.lineHeight} · {opts.fontWeight} · {opts.letterSpacing}
        </div>
      </div>
      <div
        style={{
          fontFamily: family,
          fontSize: size,
          lineHeight: opts.lineHeight,
          letterSpacing: opts.letterSpacing,
          fontWeight: opts.fontWeight,
          color: "#050505",
          minWidth: 0,
        }}
      >
        The quick brown fox jumps over the lazy dog 0123456789
      </div>
    </div>
  );
}

function TypographyPage() {
  const family = tailwindTokens.fontFamily?.label?.[0] ?? tailwindTokens.fontFamily?.code?.[0] ?? "sans-serif";
  const groups = groupByCategory(tailwindTokens.fontSize);
  const ordered = CATEGORY_ORDER.filter((c) => groups[c]);
  const total = Object.values(groups).reduce((n, g) => n + g.length, 0);

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1280px" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Typography</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "32px" }}>
        All {total} text styles generated from the Figma “Typography System Overview” frame. Re-run{" "}
        <code>npm run tokens:sync</code> after updating Figma to refresh this preview.
      </p>

      {ordered.map((category) => (
        <section key={category} style={{ marginBottom: "48px" }}>
          <h2 style={{ font: "600 18px/1.4 system-ui, sans-serif", margin: "0 0 2px", textTransform: "capitalize" }}>
            {category}
          </h2>
          <p style={{ font: "400 13px/1.5 system-ui, sans-serif", opacity: 0.55, margin: "0 0 12px" }}>
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
          <div>
            {groups[category]
              .sort((a, b) => a.tokenName.localeCompare(b.tokenName))
              .map((style) => (
                <SpecimenRow
                  key={style.tokenName}
                  family={family}
                  tokenName={style.tokenName}
                  size={style.size}
                  opts={style.opts}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default {
  title: "Foundations/Typography",
  component: TypographyPage,
  parameters: { layout: "fullscreen" },
};

export const AllTextStyles = {};
