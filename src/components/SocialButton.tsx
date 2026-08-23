import React, { useState } from "react";
import { socialBrandIcons } from "./icons";
import { fontStyle } from "./typography";

const v = (name: string) => `var(--color-${name.replace(/\./g, "-")})`;

const BRANDS = {
  apple: { color: "#000000", label: "Continue with Apple" },
  google: { color: "#f14336", label: "Continue with Google" },
  facebook: { color: "#1977f3", label: "Continue with Facebook" },
  linkedin: { color: "#0077b5", label: "Continue with LinkedIn" },
  x: { color: "#000000", label: "Continue with X" },
  github: { color: "#24292f", label: "Continue with GitHub" },
} as const;

export type SocialBrand = keyof typeof BRANDS;
export type SocialHierarchy = "filled" | "tint" | "outlined";

export interface SocialButtonProps {
  brand?: SocialBrand;
  hierarchy?: SocialHierarchy;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function SocialButton({
  brand = "google",
  hierarchy = "filled",
  disabled = false,
  onClick,
  children,
  ...rest
}: SocialButtonProps &
  Omit<React.ComponentPropsWithoutRef<"button">, "disabled" | "onClick">) {
  const b = BRANDS[brand];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  let background: string;
  let borderColor: string;
  let color: string;

  if (disabled) {
    background = v("background.static.disabled");
    borderColor = "transparent";
    color = v("icon.neutral.quinary");
  } else if (hierarchy === "tint") {
    background = hovered
      ? v("background.fill.quaternary.hover")
      : v("background.fill.quaternary.default");
    borderColor = "transparent";
    color = b.color;
  } else if (hierarchy === "outlined") {
    background = hovered ? v("background.static.hover") : "#ffffff";
    borderColor = hovered
      ? v("border.fill.tertiary.hover")
      : v("border.fill.tertiary.default");
    color = b.color;
  } else {
    background = b.color;
    borderColor = "transparent";
    color = "#ffffff";
  }

  const icon = socialBrandIcons[brand];
  const iconBox = {
    width: 20,
    height: 20,
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
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={{
        ...fontStyle("label-medium-medium"),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 44,
        padding: children == null ? 0 : "12px 18px",
        borderRadius: 10,
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 120ms ease, border-color 120ms ease",
        outline: "none",
        boxShadow:
          focused && !disabled
            ? `0 0 0 2px var(--color-background-static-default), 0 0 0 4px ${v("border.fill.secondary.default")}`
            : "none",
        background,
        border: `1px solid ${borderColor}`,
        color,
      }}
      {...rest}
    >
      <span aria-hidden style={iconBox}>
        {icon}
      </span>
      {children != null && children}
    </button>
  );
}

export default SocialButton;
