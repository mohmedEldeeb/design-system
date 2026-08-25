import type { SVGProps } from "react";
import { action } from "@storybook/addon-actions";
import { Button } from "../src/components/Button";
import type { ButtonHierarchy, ButtonSize, ButtonType } from "../src/components/Button";

const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path
      d="M6 3.5L10.5 8L6 12.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = (
  <svg
    width="80%"
    height="80%"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
  >
    <path
      d="M2.5 4h11M6.5 4V2.8c0-.44.36-.8.8-.8h1.4c.44 0 .8.36.8.8V4M4 4l.6 9c.04.55.48 1 1.03 1h4.74c.55 0 .99-.45 1.03-1L12 4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PlaygroundArgs {
  type?: ButtonType;
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  label?: string;
  fab?: boolean;
  disabled?: boolean;
  startIcon?: boolean;
  endIcon?: boolean;
}

function PlaygroundRender({
  type,
  hierarchy,
  size,
  label,
  fab,
  disabled,
  startIcon,
  endIcon,
}: PlaygroundArgs) {
  return (
    <div
      style={{
        padding: "40px",
        display: "flex",
        gap: "24px",
        alignItems: "center",
        flexWrap: "wrap",
        background: "var(--color-background-surface-secondary)",
      }}
    >
      <Button
        type={type}
        hierarchy={hierarchy}
        size={size}
        fab={fab}
        disabled={disabled}
        startIcon={startIcon ? <ChevronIcon /> : undefined}
        endIcon={
          endIcon ? (
            <ChevronIcon style={{ transform: "rotate(180deg)" }} />
          ) : undefined
        }
        onClick={action("button-click")}
      >
        {label}
      </Button>
    </div>
  );
}

export const Playground = {
  args: {
    type: "brand",
    hierarchy: "filled",
    size: "medium",
    label: "Continue",
    fab: false,
    disabled: false,
    startIcon: false,
    endIcon: false,
  },
  argTypes: {
    type: { control: "radio", options: ["brand", "neutral", "destructive"] },
    hierarchy: {
      control: "select",
      options: ["filled", "tint", "outlined", "ghost"],
    },
    size: {
      control: "select",
      options: ["x-small", "small", "medium", "large", "x-large"],
    },
    label: { control: "text", if: { arg: "fab", truthy: false } },
    fab: { control: "boolean", description: "Icon-only square button" },
    disabled: { control: "boolean" },
    startIcon: { control: "boolean" },
    endIcon: { control: "boolean" },
  },
  render: PlaygroundRender,
};

const HIERARCHIES: ButtonHierarchy[] = ["filled", "tint", "outlined", "ghost"];

function TypeSection({ type }: { type: ButtonType }) {
  return (
    <section style={{ marginBottom: "48px" }}>
      <h2
        style={{
          font: "600 18px/1.4 system-ui, sans-serif",
          margin: "0 0 12px",
          textTransform: "capitalize",
        }}
      >
        {type}
      </h2>
      {HIERARCHIES.map((hierarchy) => (
        <div
          key={hierarchy}
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              width: "72px",
              fontFamily: "system-ui, sans-serif",
              fontSize: "11px",
              opacity: 0.6,
              paddingTop: "12px",
            }}
          >
            {hierarchy}
          </span>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              type={type}
              hierarchy={hierarchy}
              size="small"
              onClick={action(`${type}-${hierarchy}`)}
            >
              Continue
            </Button>
            <Button
              type={type}
              hierarchy={hierarchy}
              size="small"
              startIcon={<ChevronIcon />}
              onClick={action(`${type}-${hierarchy}`)}
            >
              Continue
            </Button>
            <Button
              type={type}
              hierarchy={hierarchy}
              size="small"
              fab
              startIcon={TrashIcon}
              aria-label="Action"
              onClick={action(`${type}-${hierarchy}-fab`)}
            />
            <Button
              type={type}
              hierarchy={hierarchy}
              size="small"
              disabled
              onClick={action(`${type}-${hierarchy}-disabled`)}
            >
              Continue
            </Button>
            <Button
              type={type}
              hierarchy={hierarchy}
              size="small"
              disabled
              fab
              startIcon={TrashIcon}
              aria-label="Action"
            />
          </div>
        </div>
      ))}
    </section>
  );
}

export function AllStates() {
  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: "1280px",
        background: "var(--color-background-surface-secondary)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          font: "700 28px/1.3 system-ui, sans-serif",
          marginBottom: "4px",
        }}
      >
        Button
      </h1>
      <p
        style={{
          font: "400 14px/1.5 system-ui, sans-serif",
          opacity: 0.6,
          marginBottom: "24px",
        }}
      >
        Synced from the Figma “Button” component set (Type × Hierarchy × State ×
        Size × FAB). Hover/press to see states.
      </p>

      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            marginBottom: "8px",
          }}
        >
          Sizes
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {(["x-small", "small", "medium", "large", "x-large"] as ButtonSize[]).map((s) => (
            <Button
              key={s}
              size={s}
              hierarchy="filled"
              onClick={action(`size-${s}`)}
            >
              Continue
            </Button>
          ))}
        </div>
      </div>

      <TypeSection type="brand" />
      <TypeSection type="neutral" />
      <TypeSection type="destructive" />
    </div>
  );
}

AllStates.parameters = { layout: "fullscreen" };

export default {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
};
