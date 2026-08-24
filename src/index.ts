// micro-design-system — public entry point.
//
//   import { Button, Checkbox, cssVar, colors } from "micro-design-system";
//   import "micro-design-system/styles.css";

// --- components -------------------------------------------------------------
export { Button } from "./components/Button";
export type {
  ButtonProps,
  ButtonSize,
  ButtonType,
  ButtonHierarchy,
} from "./components/Button";

export { Checkbox } from "./components/Checkbox";
export type {
  CheckboxProps,
  CheckboxSize,
  CheckboxHierarchy,
} from "./components/Checkbox";

export { LinkButton } from "./components/LinkButton";
export type {
  LinkButtonProps,
  LinkButtonSize,
  LinkButtonType,
} from "./components/LinkButton";

export { SocialButton } from "./components/SocialButton";
export type { SocialButtonProps, SocialBrand, SocialHierarchy } from "./components/SocialButton";

export { socialBrandIcons, ChevronIcon } from "./components/icons";

export { fontStack, fontStyle } from "./components/typography";
export type { FontFamilyName, FontToken } from "./components/typography";

// --- helpers ----------------------------------------------------------------
export { cssVar } from "./css-var";
export { setTheme, getTheme, toggleTheme } from "./theme";
export type { ThemeName } from "./theme";

// --- tokens -----------------------------------------------------------------
export {
  theme,
  colors,
  spacing,
  borderRadius,
  borderWidth,
  boxShadow,
  fontFamily,
  fontSize,
  flat,
  darkColors,
} from "./generated/tokens";
export type {
  ThemeTokens,
  FlatTokenName,
  DarkColorName,
} from "./generated/tokens";
