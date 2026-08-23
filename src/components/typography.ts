import type { CSSProperties } from "react";
import tw from "../../dist/json/tailwind-tokens.json";

const FALLBACKS = 'Arial, Tahoma, "Segoe UI", sans-serif';

export type FontFamilyName = keyof typeof tw.fontFamily;
export type FontToken = keyof typeof tw.fontSize;

export function fontStack(name: FontFamilyName = "label"): string {
  const primary = tw.fontFamily[name]?.[0];
  return primary ? `"${primary}", ${FALLBACKS}` : FALLBACKS;
}

interface TypographyOptions {
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
}

// resolveJsonModule types tuple entries as plain arrays; narrow once at the
// token boundary — every entry in tailwind-tokens.json is [size, options].
function token(styleName: FontToken): readonly [string, TypographyOptions] {
  const entry = tw.fontSize[styleName];
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
