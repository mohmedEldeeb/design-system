import type { CSSProperties } from "react";
import { fontFamily as families, fontSize as sizes } from "../generated/tokens";

const FALLBACKS = 'Arial, Tahoma, "Segoe UI", sans-serif';

export type FontFamilyName = keyof typeof families;
export type FontToken = keyof typeof sizes;

export function fontStack(name: FontFamilyName = "label"): string {
  const primary = families[name]?.[0];
  return primary ? `"${primary}", ${FALLBACKS}` : FALLBACKS;
}

interface TypographyOptions {
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
}

// resolveJsonModule types tuple entries as plain arrays; narrow once at the
// token boundary — every entry in fontSize is [size, options].
function token(styleName: FontToken): readonly [string, TypographyOptions] {
  const entry = sizes[styleName];
  if (!entry || entry.length < 2) throw new Error(`Unknown typography token: ${styleName}`);
  return entry as unknown as readonly [string, TypographyOptions];
}

export function fontStyle(styleName: FontToken): CSSProperties {
  const [size, opts] = token(styleName);
  return {
    fontFamily: fontStack(),
    fontSize: size,
    lineHeight: opts.lineHeight,
    letterSpacing: opts.letterSpacing,
    fontWeight: opts.fontWeight,
  };
}
