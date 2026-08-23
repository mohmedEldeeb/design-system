import React, { useState } from "react";
import { fontStyle } from "./typography";

const v = (name: string) => `var(--color-${name.replace(/\./g, "-")})`;

export type LinkButtonType =
  | "primary"
  | "information"
  | "neutral"
  | "success"
  | "colored"
  | "inverted";
export type LinkButtonSize = "x-small" | "small" | "medium" | "large" | "x-large";

const TYPES: Record<
  LinkButtonType,
  { color: string; hover: string; focus: string; disabled: string }
> = {
  primary: {
    color: v("text.brand.secondary"),
    hover: v("text.brand.tertiary"),
    focus: v("text.brand.primary"),
    disabled: v("text.neutral.quinary"),
  },
  information: {
    color: v("text.information.secondary"),
    hover: v("text.information.tertiary"),
    focus: v("text.information.primary"),
    disabled: v("text.neutral.quinary"),
  },
  neutral: {
    color: v("text.static.secondary"),
    hover: v("text.neutral.tertiary"),
    focus: v("text.static.primary"),
    disabled: v("text.neutral.quinary"),
  },
  success: {
    color: v("text.success.primary"),
    hover: v("text.success.secondary"),
    focus: v("text.success.primary"),
    disabled: v("text.neutral.quinary"),
  },
  colored: {
    color: v("text.error.secondary"),
    hover: v("text.error.tertiary"),
    focus: v("icon.accents.primary"),
    disabled: v("text.neutral.quinary"),
  },
  inverted: {
    color: "#ffffff",
    hover: v("text.neutral.inverted.tertiary"),
    focus: "#ffffff",
    disabled: v("text.neutral.inverted.quinary"),
  },
};

const SIZES = {
  "x-small": { gap: 4, icon: 16, font: "label-small-medium" },
  small: { gap: 6, icon: 20, font: "label-medium-medium" },
  medium: { gap: 6, icon: 20, font: "label-medium-medium" },
  large: { gap: 8, icon: 24, font: "label-large-medium" },
  "x-large": { gap: 10, icon: 24, font: "label-x-large-medium" },
} as const;

export interface LinkButtonProps {
  type?: LinkButtonType;
  size?: LinkButtonSize;
  fab?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /** @deprecated use startIcon */
  leftIcon?: React.ReactNode;
  /** @deprecated use endIcon */
  rightIcon?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function LinkButton({
  type = "primary",
  size = "medium",
  fab = false,
  disabled = false,
  startIcon,
  endIcon,
  leftIcon,
  rightIcon,
  children,
  onClick,
  ...rest
}: LinkButtonProps &
  Omit<React.ComponentPropsWithoutRef<"button">, "type" | "disabled" | "onClick">) {
  const s = SIZES[size];
  const t = TYPES[type];
  const iconStart = startIcon ?? leftIcon;
  const iconEnd = endIcon ?? rightIcon;
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);

  const color = disabled
    ? t.disabled
    : hovered || active
      ? t.hover
      : focused
        ? t.focus
        : t.color;

  const iconBox = {
    width: s.icon,
    height: s.icon,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "inherit",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={{
        ...fontStyle(s.font),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: fab ? s.icon : undefined,
        width: fab ? s.icon : undefined,
        padding: 0,
        background: "transparent",
        border: "none",
        gap: s.gap,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "color 120ms ease",
        outline: "none",
        textDecoration: "none",
        color,
      }}
      {...rest}
    >
      {!fab && iconStart && <span aria-hidden style={iconBox}>{iconStart}</span>}
      {fab ? (
        <span aria-hidden style={iconBox}>{iconStart ?? iconEnd ?? children}</span>
      ) : (
        children
      )}
      {!fab && iconEnd && <span aria-hidden style={iconBox}>{iconEnd}</span>}
    </button>
  );
}

export default LinkButton;
