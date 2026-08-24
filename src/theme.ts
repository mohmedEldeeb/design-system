/**
 * Theme switching for consumers. The stylesheet ships a light palette on
 * `:root` and overrides under `[data-theme="dark"]`, so dark mode is just an
 * attribute on `<html>` — no re-render, no context needed.
 */

export type ThemeName = "light" | "dark";

const ATTR = "data-theme";

export function setTheme(theme: ThemeName): void {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.removeAttribute(ATTR);
  else document.documentElement.setAttribute(ATTR, theme);
}

export function getTheme(): ThemeName {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute(ATTR) === "dark" ? "dark" : "light";
}

export function toggleTheme(): ThemeName {
  const next: ThemeName = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
