import React, { useState } from "react";
import type { CSSProperties } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";

const SIZES = {
  small: { box: 12, radius: 4, icon: 8, strokeWidth: 2 },
  medium: { box: 16, radius: 4, icon: 12, strokeWidth: 1.75 },
  large: { box: 20, radius: 6, icon: 16, strokeWidth: 1.75 },
} as const;

export type CheckboxSize = keyof typeof SIZES;

const HIERARCHIES = ["filled", "tint", "outline"] as const;
export type CheckboxHierarchy = (typeof HIERARCHIES)[number];

type Ring = "neutral" | "brand";

const v = (name: string) => `var(--color-${name.replace(/\./g, "-")})`;

interface VariantStyle {
  readonly bg: string;
  readonly border: string;
  readonly hoverBg?: string;
  readonly hoverBorder?: string;
  /** Check/minus mark color; unset for unchecked styles. */
  readonly icon?: string;
  readonly ring: Ring;
}

type VariantMap = { filled: VariantStyle; tint: VariantStyle; outline: VariantStyle };

const UNCHECKED_SHARED = {
  bg: v("background.static.default"),
  border: v("border.surface.secondary"),
  hoverBg: v("background.fill.secondary.default"),
  hoverBorder: v("border.fill.tertiary.default"),
  ring: "neutral",
} as const;

const UNCHECKED: VariantMap = {
  filled: UNCHECKED_SHARED,
  tint: UNCHECKED_SHARED,
  outline: {
    bg: "transparent",
    border: v("border.fill.secondary.default"),
    hoverBg: v("background.static.hover"),
    hoverBorder: v("border.fill.tertiary.default"),
    ring: "neutral",
  },
};

const CHECKED: VariantMap = {
  filled: {
    bg: v("background.brand.vibrant.default"),
    border: "transparent",
    hoverBg: v("background.brand.vibrant.hover"),
    icon: "#ffffff",
    ring: "brand",
  },
  tint: {
    bg: v("background.brand.clear.default"),
    border: v("border.brand.clear.default"),
    hoverBg: v("background.brand.clear.hover"),
    hoverBorder: v("border.brand.clear.hover"),
    icon: v("border.brand.vibrant.default"),
    ring: "brand",
  },
  outline: {
    bg: "transparent",
    border: v("border.brand.vibrant.default"),
    hoverBg: v("background.brand.clear.hover"),
    hoverBorder: v("border.brand.vibrant.hover"),
    icon: v("border.brand.vibrant.default"),
    ring: "brand",
  },
};

const DISABLED_UNCHECKED = {
  bg: "transparent",
  border: v("border.fill.primary.disabled"),
  icon: "transparent",
} as const;

const DISABLED = {
  unchecked: DISABLED_UNCHECKED,
  filled: {
    bg: v("background.static.disabled"),
    border: "transparent",
    icon: "#ffffff",
  },
  tint: {
    bg: v("background.fill.primary.disabled"),
    border: "transparent",
    icon: v("icon.neutral.quinary"),
  },
  outline: {
    bg: "transparent",
    border: v("border.fill.primary.disabled"),
    icon: v("icon.neutral.quinary"),
  },
} as const;

const RINGS = {
  neutral: `0 0 0 2px ${v("background.static.default")}, 0 0 0 3.5px ${v(
    "icon.neutral.primary"
  )}`,
  brand: `0 0 0 2px ${v("background.static.default")}, 0 0 0 3.5px ${v(
    "border.brand.vibrant.pressed"
  )}`,
} satisfies Record<Ring, string>;

function CheckMark({ size, minus }: { size: CheckboxSize; minus: boolean }) {
  const s = SIZES[size];
  return (
    <svg width={s.icon} height={s.icon} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={minus ? "M3.33331 8H12.6666" : "M3.33331 8L6.66665 11.3333L13.3333 4.66667"}
        stroke="currentColor"
        strokeWidth={s.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export interface CheckboxProps {
  hierarchy?: CheckboxHierarchy;
  size?: CheckboxSize;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  /** Simulates transient states for visual QA (stories). */
  forceState?: "hover" | "focused";
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
}

export function Checkbox({
  hierarchy = "filled",
  size = "medium",
  checked: controlledChecked,
  defaultChecked = false,
  indeterminate = false,
  disabled = false,
  forceState,
  onCheckedChange,
}: CheckboxProps) {
  const s = SIZES[size];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;
  const showHover = forceState === "hover" || hovered;
  const showFocus = forceState === "focused" || focused;

  let background: string;
  let borderColor: string;
  let color: string;
  let boxShadow = "none";
  let borderWidth = "1px";

  if (disabled) {
    const active = isChecked || indeterminate;
    const d = active ? DISABLED[hierarchy] : DISABLED.unchecked;
    background = d.bg;
    borderColor = d.border;
    color = d.icon;
  } else {
    const variant = isChecked || indeterminate ? CHECKED[hierarchy] : UNCHECKED[hierarchy];
    background =
      showHover && variant.hoverBg !== undefined ? variant.hoverBg : variant.bg;
    borderColor =
      showHover && variant.hoverBorder !== undefined
        ? variant.hoverBorder
        : variant.border;
    color = variant.icon ?? "transparent";
    if (showFocus) {
      boxShadow = RINGS[variant.ring];
      borderWidth = "0px";
    }
  }

  const rootStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: s.box,
    height: s.box,
    padding: 0,
    flexShrink: 0,
    boxSizing: "border-box",
    borderRadius: s.radius,
    background,
    border: `${borderWidth} solid ${borderColor}`,
    color,
    boxShadow,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
    outline: "none",
  };

  return (
    <RadixCheckbox.Root
      checked={indeterminate ? "indeterminate" : isChecked}
      disabled={disabled}
      onCheckedChange={(next) => {
        if (!isControlled) setInternalChecked(next === true);
        onCheckedChange?.(next);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={rootStyle}
    >
      <RadixCheckbox.Indicator
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "inherit",
        }}
      >
        <CheckMark size={size} minus={indeterminate} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

export default Checkbox;
