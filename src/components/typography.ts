import type { CSSProperties } from "react";
import { fontFamily as families, fontSize as sizes } from "../generated/tokens";

const FALLBACKS = 'Arial, Tahoma, "Segoe UI", sans-serif';

export type FontFamilyName = keyof typeof families;
export type FontToken = keyof typeof sizes;

/** Accepts both "display-medium-bold" and "display.medium.bold" (the dot
 *  format matches every other token in the system). */
export function fontStack(name: FontFamilyName = "label"): string {
  const primary = families[name]?.[0];
  return primary ? `"${primary}", ${FALLBACKS}` : FALLBACKS;
}

interface TypographyOptions {
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
}

function normalize(styleName: string): FontToken {
  return (styleName.includes(".")
    ? styleName.replaceAll(".", "-")
    : styleName) as FontToken;
}

// resolveJsonModule types tuple entries as plain arrays; narrow once at the
// token boundary — every entry in fontSize is [size, options].
function token(styleName: string): readonly [string, TypographyOptions] {
  const entry = sizes[normalize(styleName)];
  if (!entry || entry.length < 2) throw new Error(`Unknown typography token: ${styleName}`);
  return entry as unknown as readonly [string, TypographyOptions];
}

export function fontStyle(styleName: string): CSSProperties {
  const [size, opts] = token(styleName);
  return {
    fontFamily: fontStack(),
    fontSize: size,
    lineHeight: opts.lineHeight,
    letterSpacing: opts.letterSpacing,
    fontWeight: opts.fontWeight,
  };
}
