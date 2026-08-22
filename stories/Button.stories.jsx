import React from "react";
import { action } from "@storybook/addon-actions";
import { Button } from "../src/components/Button";

const ChevronIcon = (props) => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M6 3.5L10.5 8L6 12.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = (
  <svg width="80%" height="80%" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25">
    <path d="M2.5 4h11M6.5 4V2.8c0-.44.36-.8.8-.8h1.4c.44 0 .8.36.8.8V4M4 4l.6 9c.04.55.48 1 1.03 1h4.74c.55 0 .99-.45 1.03-1L12 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function PlaygroundRender({ hierarchy, size, label, fab, disabled, leftIcon, rightIcon }) {
  return (
    <div style={{ padding: "40px", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
      <Button
        hierarchy={hierarchy}
        size={size}
        fab={fab}
        disabled={disabled}
        leftIcon={leftIcon ? <ChevronIcon /> : undefined}
        rightIcon={rightIcon ? <ChevronIcon style={{ transform: "rotate(180deg)" }} /> : undefined}
        onClick={action("button-click")}
      >
        {label}
      </Button>
    </div>
  );
}

export const Playground = {
  args: {
    hierarchy: "filled",
    size: "medium",
    label: "Delete",
    fab: false,
    disabled: false,
    leftIcon: false,
    rightIcon: false,
  },
  argTypes: {
    hierarchy: { control: "radio", options: ["filled", "tint", "outlined"] },
    size: { control: "select", options: ["x-small", "small", "medium", "large", "x-large"] },
    label: { control: "text", if: { arg: "fab", truthy: false } },
    fab: { control: "boolean", description: "Icon-only square button" },
    disabled: { control: "boolean" },
    leftIcon: { control: "boolean" },
    rightIcon: { control: "boolean" },
  },
  render: PlaygroundRender,
};

function Row({ hierarchy }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "420px" }}>
      <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "13px", textTransform: "capitalize" }}>
        {hierarchy}
      </div>
      {["default", "hover", "pressed"].map((state) => (
        <div key={state} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ width: "64px", fontFamily: "system-ui, sans-serif", fontSize: "11px", opacity: 0.6 }}>{state}</span>
          <Button hierarchy={hierarchy} size="small" onClick={action(`${hierarchy}-${state}`)}>
            Delete
          </Button>
          <Button hierarchy={hierarchy} size="small" leftIcon={<ChevronIcon />} rightIcon={<ChevronIcon style={{ transform: "rotate(180deg)" }} />} onClick={action(`${hierarchy}-${state}`)}>
            Delete
          </Button>
          <Button hierarchy={hierarchy} size="small" fab leftIcon={TrashIcon} aria-label="Delete" onClick={action(`${hierarchy}-${state}-fab`)} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ width: "64px", fontFamily: "system-ui, sans-serif", fontSize: "11px", opacity: 0.6 }}>disabled</span>
        <Button hierarchy={hierarchy} size="small" disabled onClick={action(`${hierarchy}-disabled`)}>
          Delete
        </Button>
        <Button hierarchy={hierarchy} size="small" disabled leftIcon={<ChevronIcon />} onClick={action(`${hierarchy}-disabled`)}>
          Delete
        </Button>
        <Button hierarchy={hierarchy} size="small" disabled fab leftIcon={TrashIcon} aria-label="Delete" />
      </div>
      {/* static state previews via inline props are approximated by the interactive states above */}
    </div>
  );
}

export function AllStates() {
  return (
    <div style={{ padding: "32px 40px", maxWidth: "1280px" }}>
      <h1 style={{ font: "700 28px/1.3 system-ui, sans-serif", marginBottom: "4px" }}>Destructive Button</h1>
      <p style={{ font: "400 14px/1.5 system-ui, sans-serif", opacity: 0.6, marginBottom: "24px" }}>
        Synced from Figma “Destructive Button” component set — hover/press the buttons to see each state.
      </p>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: "13px", marginBottom: "8px" }}>Sizes</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {["x-small", "small", "medium", "large", "x-large"].map((s) => (
            <Button key={s} size={s} hierarchy="filled" onClick={action(`size-${s}`)}>
              Delete
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
        <Row hierarchy="filled" />
        <Row hierarchy="tint" />
        <Row hierarchy="outlined" />
      </div>
    </div>
  );
}

AllStates.parameters = { layout: "fullscreen" };

export default {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
};
