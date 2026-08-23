import React, { useState } from "react";
import type { CSSProperties } from "react";
import { fontStyle } from "./typography";

const SIZES = {
  "x-small": { height: 32, radius: 6, px: 12, py: 8, gap: 4, icon: 16, font: "label-small-medium" },
  small: { height: 40, radius: 8, px: 16, py: 10, gap: 6, icon: 20, font: "label-medium-medium" },
  medium: { height: 44, radius: 10, px: 18, py: 12, gap: 6, icon: 20, font: "label-medium-medium" },
  large: { height: 52, radius: 12, px: 20, py: 14, gap: 8, icon: 24, font: "label-large-medium" },
  "x-large": { height: 56, radius: 12, px: 24, py: 16, gap: 10, icon: 24, font: "label-x-large-medium" },
} as const;

export type ButtonSize = keyof typeof SIZES;
export type ButtonType = "brand" | "neutral" | "destructive";
export type ButtonHierarchy = "filled" | "tint" | "outlined" | "ghost";

const v = (name: string) => `var(--color-${name.replace(/\./g, "-")})`;

interface VariantStyle {
  bg?: string;
  bgHover?: string;
  bgActive?: string;
  border?: string;
  borderHover?: string;
  borderActive?: string;
  content: string;
  contentHover?: string;
}

const VARIANTS: Record<ButtonType, Record<ButtonHierarchy, VariantStyle>> = {
  brand: {
    filled: {
      bg: v("background.brand.vibrant.default"),
      bgHover: v("background.brand.vibrant.hover"),
      bgActive: v("background.brand.vibrant.pressed"),
      content: "#ffffff",
    },
    tint: {
      bg: v("background.brand.clear.default"),
      bgHover: v("background.brand.clear.hover"),
      bgActive: v("background.brand.clear.pressed"),
      content: v("text.brand.primary"),
    },
    outlined: {
      bgHover: v("background.brand.clear.hover"),
      border: v("border.brand.vibrant.default"),
      borderHover: v("border.brand.vibrant.hover"),
      borderActive: v("border.brand.vibrant.pressed"),
      content: v("text.brand.primary"),
      contentHover: v("text.brand.secondary"),
    },
    ghost: {
      bgHover: v("background.brand.clear.hover"),
      bgActive: v("background.brand.clear.default"),
      content: v("text.brand.primary"),
    },
  },
  neutral: {
    filled: {
      bg: v("background.fill.inverted.default"),
      bgHover: v("background.fill.inverted.hover"),
      bgActive: v("background.fill.inverted.pressed"),
      content: "#ffffff",
    },
    tint: {
      bg: v("background.fill.quaternary.default"),
      bgHover: v("background.fill.quaternary.hover"),
      bgActive: v("background.fill.quaternary.pressed"),
      content: v("text.static.primary"),
    },
    outlined: {
      bgHover: v("background.static.hover"),
      border: v("border.fill.tertiary.default"),
      borderHover: v("border.fill.tertiary.hover"),
      borderActive: v("border.fill.tertiary.pressed"),
      content: v("text.neutral.tertiary"),
      contentHover: v("text.static.primary"),
    },
    ghost: {
      bgHover: v("background.static.hover"),
      bgActive: v("background.static.pressed"),
      content: v("text.static.secondary"),
      contentHover: v("text.static.primary"),
    },
  },
  destructive: {
    filled: {
      bg: v("background.error.vibrant.default"),
      bgHover: v("background.error.vibrant.hover"),
      bgActive: v("background.error.vibrant.pressed"),
      content: "#ffffff",
    },
    tint: {
      bg: v("background.error.clear.default"),
      bgHover: v("background.error.clear.hover"),
      bgActive: v("background.error.clear.pressed"),
      content: v("text.error.primary"),
    },
    outlined: {
      bgHover: v("background.error.clear.hover"),
      border: v("border.error.vibrant.default"),
      borderHover: v("border.error.vibrant.hover"),
      borderActive: v("border.error.vibrant.pressed"),
      content: v("text.error.primary"),
      contentHover: v("text.error.secondary"),
    },
    ghost: {
      bgHover: v("background.error.clear.hover"),
      bgActive: v("background.error.clear.default"),
      content: v("text.error.primary"),
    },
  },
};

const DISABLED = {
  bg: v("background.static.disabled"),
  bgTint: v("background.fill.primary.disabled"),
  border: v("border.fill.secondary.disabled"),
  content: v("text.neutral.quinary"),
};

export interface ButtonProps {
  type?: ButtonType;
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  fab?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /** @deprecated use startIcon */
  leftIcon?: React.ReactNode;
  /** @deprecated use endIcon */
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function Button({
  type = "brand",
  hierarchy = "filled",
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
}: ButtonProps &
  Omit<React.ComponentPropsWithoutRef<"button">, "type" | "disabled" | "onClick">) {
  const s = SIZES[size];
  const variant: VariantStyle =
    VARIANTS[type]?.[hierarchy] ?? VARIANTS.brand.filled;
  const iconStart = startIcon ?? leftIcon;
  const iconEnd = endIcon ?? rightIcon;
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);

  let background: string | undefined;
  let borderColor: string | undefined;
  let color: string | undefined;

  if (disabled) {
    background = hierarchy === "tint" ? DISABLED.bgTint : DISABLED.bg;
    borderColor = hierarchy === "outlined" ? DISABLED.border : "transparent";
    color = DISABLED.content;
  } else if (hierarchy === "outlined") {
    background = active ? variant.bgActive ?? "transparent" : hovered ? variant.bgHover : "transparent";
    borderColor = active ? variant.borderActive : hovered ? variant.borderHover : variant.border;
    color = hovered || active ? variant.contentHover ?? variant.content : variant.content;
  } else if (hierarchy === "ghost") {
    background = active ? variant.bgActive : hovered ? variant.bgHover : "transparent";
    borderColor = "transparent";
    color = hovered || active ? variant.contentHover ?? variant.content : variant.content;
  } else {
    background = active ? variant.bgActive : hovered ? variant.bgHover : variant.bg;
    borderColor = "transparent";
    color = variant.content;
  }

  const focusColor =
    type === "neutral"
      ? v("border.fill.secondary.default")
      : v(`border.${type === "brand" ? "brand" : "error"}.vibrant.default`);

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
        height: s.height,
        width: fab ? s.height : undefined,
        padding: fab ? 0 : `${s.py}px ${s.px}px`,
        borderRadius: s.radius,
        gap: s.gap,
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 120ms ease, border-color 120ms ease, color 120ms ease",
        outline: "none",
        boxShadow: focused && !disabled ? `0 0 0 2px var(--color-background-static-default), 0 0 0 4px ${focusColor}` : "none",
        background,
        border: `1px solid ${borderColor}`,
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

export default Button;
