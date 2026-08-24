/**
 * Resolves a semantic color token dot-path to a CSS `var()` reference that
 * follows the active theme (light / `[data-theme="dark"]`). Accepts the path
 * with or without the leading `color.` category.
 *
 *   cssVar("background.brand.vibrant.default")
 *   // => "var(--color-background-brand-vibrant-default)"
 *   cssVar("color.border.fill.secondary.disabled")
 *   // => "var(--color-border-fill-secondary-disabled)"
 */
export function cssVar(dotPath: string): string {
  const withoutCategory = dotPath.startsWith("color.")
    ? dotPath.slice("color.".length)
    : dotPath;
  return `var(--color-${withoutCategory.replaceAll(".", "-")})`;
}
