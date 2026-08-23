import tw from "../../dist/json/tailwind-tokens.json";

const FALLBACKS = 'Arial, Tahoma, "Segoe UI", sans-serif';

export function fontStack(name = "label") {
  const primary = tw.fontFamily?.[name]?.[0];
  return primary ? `"${primary}", ${FALLBACKS}` : FALLBACKS;
}

function token(styleName) {
  return tw.fontSize[styleName];
}

export function fontStyle(styleName) {
  const t = token(styleName);
  if (!t) return {};
  const [size, opts] = t;
  return {
    fontFamily: fontStack(),
    fontSize: size,
    lineHeight: opts.lineHeight,
    letterSpacing: opts.letterSpacing,
    fontWeight: opts.fontWeight,
  };
}
