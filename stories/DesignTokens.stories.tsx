import React from "react";
import tailwindTokens from "../dist/json/tailwind-tokens.json";
import { fontStack } from "../src/components/typography";

// ---------------------------------------------------------------------------
// Helpers to walk the generated theme object
// ---------------------------------------------------------------------------
interface FlatToken {
  name: string;
  value: string;
}

const theme = tailwindTokens as unknown as Record<string, Record<string, unknown>>;

function flattenColors(obj: unknown, prefix: string[] = []): FlatToken[] {
  const out: FlatToken[] = [];
  if (typeof obj !== "object" || obj === null) return out;
  for (const [key, value] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (typeof value === "string") {
      out.push({ name: path.join("."), value });
    } else {
      out.push(...flattenColors(value, path));
    }
  }
  return out;
}

const sectionStyle = { marginBottom: "40px" };
const headingStyle = { font: "600 18px/1.4 system-ui, sans-serif", marginBottom: "12px" };
const subheadingStyle = { font: "600 13px/1.4 system-ui, sans-serif", margin: "20px 0 8px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" };

function ColorGrid({ colors }: { colors: FlatToken[] }) {
  const groups: Record<string, FlatToken[]> = {};
  for (const c of colors) {
    const top = c.name.split(".")[0] ?? "";
    groups[top] = groups[top] || [];
    groups[top].push(c);
  }
  return (
    <div>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div style={subheadingStyle}>{group}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
            {items.map((c) => (
              <div key={c.name} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
                <div style={{ height: "48px", background: c.value }} />
                <div style={{ padding: "8px", fontSize: "11px", lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{c.name}</div>
                  <div style={{ opacity: 0.6 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpacingScale({ spacing }: { spacing: Record<string, string> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Object.entries(spacing).map(([name, value]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "system-ui, sans-serif", fontSize: "12px" }}>
          <div style={{ width: "60px", opacity: 0.6 }}>{name}px</div>
          <div style={{ height: "16px", width: value, background: "#274dff", borderRadius: "2px" }} />
          <div style={{ opacity: 0.6 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function RadiusGrid({ radius }: { radius: Record<string, Record<string, string>> }) {
  const flat: FlatToken[] = [];
  for (const [group, steps] of Object.entries(radius)) {
    for (const [step, value] of Object.entries(steps)) {
      flat.push({ name: `${group}.${step}`, value });
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
      {flat.map((r) => (
        <div key={r.name} style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: "11px" }}>
          <div style={{ width: "72px", height: "72px", background: "#eae9ff", border: "2px solid #274dff", borderRadius: r.value }} />
          <div style={{ marginTop: "6px", fontWeight: 600 }}>{r.name}</div>
          <div style={{ opacity: 0.6 }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function ShadowGrid({ shadows }: { shadows: Record<string, string> }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
      {Object.entries(shadows).map(([name, value]) => (
        <div key={name} style={{ textAlign: "center", fontFamily: "system-ui, sans-serif", fontSize: "11px" }}>
          <div style={{ width: "96px", height: "72px", background: "#fff", boxShadow: value, borderRadius: "8px" }} />
          <div style={{ marginTop: "12px", fontWeight: 600 }}>{name}</div>
        </div>
      ))}
    </div>
  );
}

function TypographySamples({
  fontSize,
  fontFamily,
}: {
  fontSize: Record<string, Record<string, unknown>>;
  fontFamily: Record<string, string[]>;
}) {
  const family = fontStack();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Object.entries(fontSize).map(([name, entry]) => {
        const [size, opts] = entry as unknown as [
          string,
          { lineHeight: string; letterSpacing: string; fontWeight: string },
        ];
        return (
        <div key={name} style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <div style={{ width: "220px", fontFamily: "system-ui, sans-serif", fontSize: "11px", opacity: 0.6 }}>
            {name} — {size}/{opts.lineHeight}, {opts.letterSpacing}, {opts.fontWeight}
          </div>
          <div
            style={{
              fontFamily: family,
              fontSize: size,
              lineHeight: opts.lineHeight,
              letterSpacing: opts.letterSpacing,
              fontWeight: opts.fontWeight,
            }}
          >
            Design system tokens, synced from Figma.
          </div>
        </div>
        );
      })}
    </div>
  );
}

function DesignTokensPage() {
  const colors = flattenColors(tailwindTokens.colors);
  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Design Tokens</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "32px" }}>
        Generated from Figma variables via Style Dictionary. Re-run <code>npm run tokens:sync</code> after updating
        Figma to refresh this preview.
      </p>

      <section style={sectionStyle}>
        <div style={headingStyle}>Typography</div>
        <TypographySamples
          fontSize={tailwindTokens.fontSize as unknown as Record<string, Record<string, unknown>>}
          fontFamily={tailwindTokens.fontFamily as unknown as Record<string, string[]>}
        />
      </section>

      <section style={sectionStyle}>
        <div style={headingStyle}>Spacing</div>
        <SpacingScale spacing={tailwindTokens.spacing} />
      </section>

      <section style={sectionStyle}>
        <div style={headingStyle}>Radius</div>
        <RadiusGrid radius={tailwindTokens.borderRadius} />
      </section>

      <section style={sectionStyle}>
        <div style={headingStyle}>Shadows</div>
        <ShadowGrid shadows={tailwindTokens.boxShadow} />
      </section>

      <section style={sectionStyle}>
        <div style={headingStyle}>Colors ({colors.length} tokens)</div>
        <ColorGrid colors={colors} />
      </section>
    </div>
  );
}

export default {
  title: "Foundations/Design Tokens",
  component: DesignTokensPage,
  parameters: { layout: "fullscreen" },
};

export const AllTokens = {};
