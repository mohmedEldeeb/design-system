import React, { useState } from "react";
import { Checkbox } from "../src/components/Checkbox";

const HIERARCHIES = ["filled", "tint", "outline"];
const SIZES = ["small", "medium", "large"];
const STATES = ["default", "hover", "focused", "disabled"];

function PlaygroundRender({
  hierarchy,
  size,
  checked,
  indeterminate,
  disabled,
  label,
}) {
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
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
      />
      <label
        style={{
          fontFamily:
            "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: "14px",
          color: "var(--color-text-neutral-secondary)",
          userSelect: "none",
        }}
      >
        {label}
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

function StateGroup({ hierarchy, size, state }) {
  const [checked, setChecked] = useState(false);
  const disabled = state === "disabled";
  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked={checked}
        disabled={disabled}
        onCheckedChange={setChecked}
      />
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked={!disabled && true}
        indeterminate
        disabled={disabled}
      />
      <Checkbox
        hierarchy={hierarchy}
        size={size}
        checked
        disabled={disabled}
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

    const row = {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontSize: "14px",
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
            onCheckedChange={setSingle}
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
            paddingLeft: "8px",
          }}
        >
          <label style={{ ...row, fontWeight: 500 }}>
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
          <label style={{ ...row, paddingLeft: "20px" }}>
            <Checkbox
              hierarchy="tint"
              size="small"
              checked={children[0]}
              onCheckedChange={(next) => setChildren([Boolean(next), children[1]])}
            />
            Email notifications
          </label>
          <label style={{ ...row, paddingLeft: "20px" }}>
            <Checkbox
              hierarchy="tint"
              size="small"
              checked={children[1]}
              onCheckedChange={(next) => setChildren([children[0], Boolean(next)])}
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
