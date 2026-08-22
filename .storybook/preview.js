// Generated CSS custom properties from the token pipeline (npm run tokens:build)
import "../dist/css/variables.css";
// Tailwind base/components/utilities, for when component stories are added later
import "../src/index.css";
import { withThemeByDataAttribute } from "@storybook/addon-themes";

/** @type {import('@storybook/react').Preview} */
const preview = {
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
