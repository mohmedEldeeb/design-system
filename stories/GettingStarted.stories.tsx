import React from "react";
import type { CSSProperties } from "react";
import { Button } from "../src/components/Button";
import { LinkButton } from "../src/components/LinkButton";
import { SocialButton } from "../src/components/SocialButton";
import { ChevronIcon } from "../src/components/icons";

const codeStyle: CSSProperties = {
  background: "#f6f8fa",
  border: "1px solid #e4e7eb",
  borderRadius: "8px",
  padding: "14px 16px",
  font: "12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace",
  overflowX: "auto",
  whiteSpace: "pre",
  margin: 0,
};

const sectionStyle = { maxWidth: "860px", marginBottom: "56px" };
const h2Style = {
  font: "600 20px/1.4 system-ui, sans-serif",
  margin: "0 0 6px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e4e7eb",
};
const pStyle = {
  font: "400 14px/1.7 system-ui, sans-serif",
  opacity: 0.75,
  marginBottom: "16px",
};
const demoBoxStyle: CSSProperties = {
  border: "1px solid var(--color-border-surface-primary)",
  borderRadius: "12px",
  padding: "28px",
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
};

function Code({ children }: { children?: React.ReactNode }) {
  return <pre style={codeStyle}>{children}</pre>;
}

function Demo({ children }: { children?: React.ReactNode }) {
  return <div style={demoBoxStyle}>{children}</div>;
}

function GettingStartedPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, sans-serif" }}>
      <h1
        style={{
          font: "700 32px/1.3 system-ui, sans-serif",
          margin: "0 0 8px",
        }}
      >
        Getting Started
      </h1>
      <p style={{ ...pStyle, fontSize: "15px", maxWidth: "720px" }}>
        Micro Design System ships design tokens (colors, typography, spacing)
        synced from Figma, plus ready-to-use React components styled entirely
        with those tokens. This page shows the most common ways to use it.
      </p>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>1 · Import the styles once</h2>
        <p style={pStyle}>
          In your app entry file, import the generated CSS variables and
          Tailwind utilities. After that, every token is available everywhere.
        </p>
        <Code>{`// app entry (e.g. main.jsx / index.jsx)
import "@micro-design-system/dist/css/variables.css"; // CSS custom properties
import "@micro-design-system/src/index.css";          // Tailwind base + utilities`}</Code>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>2 · Use tokens</h2>
        <p style={pStyle}>
          Every Figma variable reaches you in three shapes — pick whichever
          fits:
        </p>
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <div>
            <div
              style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}
            >
              Tailwind class
            </div>
            <Code>{`<button className="bg-background-brand-vibrant-default">
  Continue
</button>`}</Code>
          </div>
          <div>
            <div
              style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}
            >
              CSS variable
            </div>
            <Code>{`.card {
  background: var(--color-background-surface-primary);
}`}</Code>
          </div>
          <div>
            <div
              style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}
            >
              JS value
            </div>
            <Code>{`import tokens from ".../dist/json/tokens.json";

tokens["color.background.brand.vibrant.default"];
// → "#274dff"`}</Code>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>3 · Button</h2>
        <p style={pStyle}>
          Three <code>type</code> families (brand / neutral / destructive), four{" "}
          <code>hierarchy</code> levels, five sizes, icon slots and an icon-only
          FAB mode.
        </p>
        <Demo>
          <Button hierarchy="filled">Continue</Button>
          <Button hierarchy="tint" startIcon={<ChevronIcon />}>
            Continue
          </Button>
          <Button hierarchy="outlined">Continue</Button>
          <Button type="neutral" hierarchy="filled">
            Continue
          </Button>
          <Button type="destructive" hierarchy="tint">
            Delete
          </Button>
          <Button
            size="small"
            fab
            startIcon={<ChevronIcon />}
            aria-label="Next"
          />
        </Demo>
        <div style={{ height: "12px" }} />
        <Code>{`import { Button } from "@micro-design-system";

<Button hierarchy="tint" startIcon={<ChevronIcon />} onClick={save}>
  Continue
</Button>

<Button type="destructive" hierarchy="tint" onClick={destroy}>
  Delete
</Button>

<Button size="small" fab startIcon={<ChevronIcon />} aria-label="Next" />`}</Code>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>4 · LinkButton & SocialButton</h2>
        <p style={pStyle}>
          Text links in six semantic types, and pre-styled social sign-in
          buttons for six providers.
        </p>
        <Demo>
          <LinkButton
            type="primary"
            endIcon={<ChevronIcon style={{ transform: "rotate(180deg)" }} />}
          >
            Learn more
          </LinkButton>
          <LinkButton type="colored">Remove</LinkButton>
          <SocialButton brand="google" />
          <SocialButton brand="apple" />
          <SocialButton brand="github" hierarchy="outlined" />
        </Demo>
        <div style={{ height: "12px" }} />
        <Code>{`import { LinkButton, SocialButton } from "@micro-design-system";

<LinkButton type="primary" href="/docs">Learn more</LinkButton>

<SocialButton brand="google" onClick={signInWithGoogle} />
<SocialButton brand="github" hierarchy="outlined" />`}</Code>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>5 · Dark mode</h2>
        <p style={pStyle}>
          All tokens have light and dark values. Set{" "}
          <code>data-theme="dark"</code> on <code>&lt;html&gt;</code> and
          everything switches automatically — try the theme toggle in the
          Storybook toolbar above ☝️.
        </p>
        <Code>{`document.documentElement.setAttribute("data-theme", "dark");
// …and back:
document.documentElement.removeAttribute("data-theme");`}</Code>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Where to look next</h2>
        <ul style={{ ...pStyle, paddingInlineStart: "20px" }}>
          <li>
            <strong>Foundations → Typography / Colors</strong> — every generated
            token, live
          </li>
          <li>
            <strong>Components → Button</strong> — full variant matrix with
            Controls & Actions
          </li>
          <li>
            <strong>docs/HOW-IT-WORKS.md</strong> — how the Figma → tokens
            pipeline runs
          </li>
          <li>
            <strong>docs/DARK-MODE-SPEC.md</strong> — theming architecture
          </li>
        </ul>
      </section>
    </div>
  );
}

export default {
  title: "Guides/Getting Started",
  parameters: { layout: "fullscreen", options: { showPanel: false } },
};

export const Overview = {
  render: () => <GettingStartedPage />,
};
