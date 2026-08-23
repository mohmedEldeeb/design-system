import React, { useState } from "react";
import tw from "../../dist/json/tailwind-tokens.json";
import { socialBrandIcons } from "./icons";

const v = (name) => `var(--color-${name.replace(/\./g, "-")})`;

// Brand colors are fixed brand identities (not theme tokens), per the
// Figma "Social Buttons" component set. Tint/outlined chrome uses tokens.
const BRANDS = {
  apple: { color: "#000000", label: "Continue with Apple" },
  google: { color: "#f14336", label: "Continue with Google" },
  facebook: { color: "#1977f3", label: "Continue with Facebook" },
  linkedin: { color: "#0077b5", label: "Continue with LinkedIn" },
  x: { color: "#000000", label: "Continue with X" },
  github: { color: "#24292f", label: "Continue with GitHub" },
};

function font() {
  const [size, opts] = tw.fontSize["label-medium-medium"];
  return {
    fontFamily: tw.fontFamily.label?.[0] ?? "sans-serif",
    fontSize: size,
    lineHeight: opts.lineHeight,
    letterSpacing: opts.letterSpacing,
    fontWeight: opts.fontWeight,
  };
}

export function SocialButton({
  brand = "google",
  hierarchy = "filled",
  disabled = false,
  onClick,
  children,
  ...rest
}) {
  const b = BRANDS[brand] ?? BRANDS.google;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  let background;
  let borderColor;
  let color;

  if (disabled) {
    background = v("background.static.disabled");
    borderColor = "transparent";
    color = v("icon.neutral.quinary");
  } else if (hierarchy === "tint") {
    background = hovered ? v("background.fill.quaternary.hover") : v("background.fill.quaternary.default");
    borderColor = "transparent";
    color = b.color;
  } else if (hierarchy === "outlined") {
    background = hovered ? v("background.static.hover") : "#ffffff";
    borderColor = hovered ? v("border.fill.tertiary.hover") : v("border.fill.tertiary.default");
    color = b.color;
  } else {
    background = b.color;
    borderColor = "transparent";
    color = "#ffffff";
  }

  const icon = socialBrandIcons[brand] ?? socialBrandIcons.google;
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
        ...font(),
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
        boxShadow: focused && !disabled ? `0 0 0 2px var(--color-background-static-default), 0 0 0 4px ${v("border.fill.secondary.default")}` : "none",
        background,
        border: `1px solid ${borderColor}`,
        color,
      }}
      {...rest}
    >
      <span aria-hidden style={iconBox}>{icon}</span>
      {children != null && children}
    </button>
  );
}

export default SocialButton;
