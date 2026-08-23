import type { Config } from "tailwindcss";
import tokens from "./dist/json/tailwind-tokens.json";

export default {
  content: [
    "./stories/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./.storybook/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      borderWidth: tokens.borderWidth,
      boxShadow: tokens.boxShadow,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
    },
  },
  plugins: [],
} satisfies Config;
