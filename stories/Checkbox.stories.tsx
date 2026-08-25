import { useState } from "react";
import type { CSSProperties } from "react";
import { Checkbox } from "../src/components/Checkbox";
import type { CheckboxHierarchy, CheckboxSize } from "../src/components/Checkbox";
import { fontStyle } from "../src/components/typography";

const HIERARCHIES: CheckboxHierarchy[] = ["filled", "tint", "outline"];
const SIZES: CheckboxSize[] = ["small", "medium", "large"];
const STATES = ["default", "hover", "focused", "disabled"] as const;

interface PlaygroundArgs {
  hierarchy?: CheckboxHierarchy;
  size?: CheckboxSize;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
}

function PlaygroundRender({
  hierarchy,
  size,
  checked,
  indeterminate,
  disabled,
  label,
}: PlaygroundArgs) {
  const [on, setOn] = useState(checked);
  return (
    <div
      style={{
        padding: "40px",
        display: "flex",
        gap: "12px",
        alignItems: "center",
        background: "var(--color-background-surface-secondary)",
      }}
    >
      <label
        style={{
          display: "inline-flex",
          gap: "12px",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Checkbox
          hierarchy={hierarchy}
          size={size}
          checked={indeterminate ? checked : on}
          indeterminate={indeterminate}
          disabled={disabled}
          onCheckedChange={(next) => setOn(next === true)}
        />
        <span
          style={{
            ...fontStyle("label-medium-medium"),
            color: "var(--color-text-neutral-secondary)",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      </label>
    </div>
  );
}

export const Playground = {
  args: {
    hierarchy: "filled",
    size: "medium",
    checked: true,
    indeterminate: false,
    disabled: false,
    label: "Label",
  },
  argTypes: {
    hierarchy: { control: "radio", options: HIERARCHIES },
    size: { control: "radio", options: SIZES },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
    label: { control: "text" },
  },
  render: PlaygroundRender,
};

function StateGroup({
  hierarchy,
  size,
  state,
}: {
  hierarchy: CheckboxHierarchy;
  size: CheckboxSize;
  state: (typeof STATES)[number];
}) {
  const [checked, setChecked] = useState(false);
  const disabled = state === "disabled";
  const forceState = state === "hover" || state === "focused" ? state : undefined;
  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked={checked}
        disabled={disabled}
        forceState={forceState}
        onCheckedChange={(next) => setChecked(next === true)}
      />
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked={!disabled}
        indeterminate
        disabled={disabled}
        forceState={forceState}
      />
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked
        disabled={disabled}
        forceState={forceState}
      />
    </div>
  );
}

export const AllVariants = {
  name: "All variants",
  render: () => (
    <div
      style={{
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        background: "var(--color-background-surface-secondary)",
      }}
    >
      {HIERARCHIES.map((hierarchy) => (
        <section key={hierarchy}>
          <h2
            style={{
              font: "600 16px/1.4 'Plus Jakarta Sans', system-ui, sans-serif",
              margin: "0 0 12px",
              textTransform: "capitalize",
            }}
          >
            {hierarchy}
          </h2>
          {SIZES.map((size) => (
            <div
              key={size}
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                marginBottom: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  width: "48px",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "11px",
                  opacity: 0.6,
                }}
              >
                {size}
              </span>
              {STATES.map((state) => (
                <div key={state} style={{ textAlign: "center" }}>
                  <StateGroup hierarchy={hierarchy} size={size} state={state} />
                  <span
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontSize: "10px",
                      opacity: 0.5,
                    }}
                  >
                    {state}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  ),
};

export const WithLabels = {
  name: "With labels",
  render: () => {
    const [single, setSingle] = useState(true);
    const [parent, setParent] = useState(false);
    const [children, setChildren] = useState([true, false]);
    const allChecked = children.every(Boolean);
    const someChecked = children.some(Boolean);

    const row: CSSProperties = {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      ...fontStyle("label-medium-medium"),
      color: "var(--color-text-neutral-secondary)",
      userSelect: "none",
    };

    return (
      <div
        style={{
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          background: "var(--color-background-surface-secondary)",
        }}
      >
          <label style={row}>
            <Checkbox
              checked={single}
              onCheckedChange={(next) => setSingle(next === true)}
              hierarchy="filled"
              size="medium"
            />
            Accept terms and conditions
          </label>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingInlineStart: "8px",
          }}
        >
          <label style={{ ...row, fontWeight: 500 } as CSSProperties}>
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onCheckedChange={(next) =>
                setChildren([Boolean(next), Boolean(next)])
              }
              hierarchy="tint"
              size="medium"
            />
            Select all
          </label>
          <label style={{ ...row, paddingInlineStart: "20px" }}>
            <Checkbox
              hierarchy="tint"
              size="small"
              checked={children[0] ?? false}
              onCheckedChange={(next) => setChildren([Boolean(next), children[1] ?? false])}
            />
            Email notifications
          </label>
          <label style={{ ...row, paddingInlineStart: "20px" }}>
            <Checkbox
              hierarchy="tint"
              size="small"
              checked={children[1] ?? false}
              onCheckedChange={(next) => setChildren([children[0] ?? false, Boolean(next)])}
            />
            SMS notifications
          </label>
        </div>
      </div>
    );
  },
};

export default {
  title: "Components/Checkbox",
  component: Checkbox,
};
