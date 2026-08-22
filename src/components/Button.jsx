import React, { useState } from "react";
import tw from "../../dist/json/tailwind-tokens.json";

const SIZES = {
  "x-small": { height: 32, radius: 6, px: 12, py: 8, gap: 4, icon: 16, font: "label-small-medium" },
  small: { height: 40, radius: 8, px: 16, py: 10, gap: 6, icon: 20, font: "label-medium-medium" },
  medium: { height: 44, radius: 10, px: 18, py: 12, gap: 6, icon: 20, font: "label-medium-medium" },
  large: { height: 52, radius: 12, px: 20, py: 14, gap: 8, icon: 24, font: "label-large-medium" },
  "x-large": { height: 56, radius: 12, px: 24, py: 16, gap: 10, icon: 24, font: "label-x-large-medium" },
};

const V = {
  filled: {
    bg: "var(--color-background-error-vibrant-default)",
    bgHover: "var(--color-background-error-vibrant-hover)",
    bgActive: "var(--color-background-error-vibrant-pressed)",
    bgDisabled: "var(--color-background-static-disabled)",
    content: "#ffffff",
    contentDisabled: "var(--color-icon-neutral-quinary)",
  },
  tint: {
    bg: "var(--color-background-error-clear-default)",
    bgHover: "var(--color-background-error-clear-hover)",
    bgActive: "var(--color-background-error-clear-pressed)",
    bgDisabled: "var(--color-background-static-disabled)",
    content: "var(--color-text-error-primary)",
    contentDisabled: "var(--color-text-neutral-quinary)",
  },
  outlined: {
    borderDefault: "var(--color-border-error-vibrant-default)",
    borderHover: "var(--color-border-error-vibrant-hover)",
    borderActive: "var(--color-border-error-vibrant-pressed)",
    borderDisabled: "var(--color-border-fill-secondary-disabled)",
    bgHover: "var(--color-background-error-clear-hover)",
    bgActive: "var(--color-background-error-clear-pressed)",
    content: "var(--color-text-error-primary)",
    contentHover: "var(--color-text-error-secondary)",
    contentDisabled: "var(--color-text-neutral-quinary)",
  },
};

function font(styleName) {
  const [size, opts] = tw.fontSize[styleName];
  return {
    fontFamily: tw.fontFamily.label?.[0] ?? "sans-serif",
    fontSize: size,
    lineHeight: opts.lineHeight,
    letterSpacing: opts.letterSpacing,
    fontWeight: opts.fontWeight,
  };
}

export function Button({
  hierarchy = "filled",
  size = "medium",
  fab = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  ...rest
}) {
  const s = SIZES[size] ?? SIZES.medium;
  const v = V[hierarchy] ?? V.filled;
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);

  let background;
  let borderColor;
  let color;

  if (disabled) {
    background = v.bgDisabled;
    borderColor = hierarchy === "outlined" ? v.borderDisabled : "transparent";
    color = v.contentDisabled;
  } else if (hierarchy === "outlined") {
    background = active ? v.bgActive : hovered ? v.bgHover : "transparent";
    borderColor = active ? v.borderActive : hovered ? v.borderHover : v.borderDefault;
    color = hovered || active ? v.contentHover : v.content;
  } else {
    background = active ? v.bgActive : hovered ? v.bgHover : v.bg;
    borderColor = "transparent";
    color = v.content;
  }

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
        ...font(s.font),
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
        boxShadow: focused && !disabled ? `0 0 0 2px #ffffff, 0 0 0 4px var(--color-border-error-vibrant-default)` : "none",
        background,
        border: `1px solid ${borderColor}`,
        color,
      }}
      {...rest}
    >
      {!fab && leftIcon && <span aria-hidden style={iconBox}>{leftIcon}</span>}
      {fab ? (
        <span aria-hidden style={iconBox}>{leftIcon ?? rightIcon ?? children}</span>
      ) : (
        children
      )}
      {!fab && rightIcon && <span aria-hidden style={iconBox}>{rightIcon}</span>}
    </button>
  );
}

export default Button;
