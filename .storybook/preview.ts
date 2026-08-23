// Generated CSS custom properties from the token pipeline (npm run tokens:build)
import "../dist/css/variables.css";
// Tailwind base/components/utilities, for when component stories are added later
import "../src/index.css";
import React from "react";
import { withThemeByDataAttribute } from "@storybook/addon-themes";

/** @type {import('@storybook/react').Preview} */
const preview = {
  globalTypes: {
    direction: {
      description: "Text direction for the story preview",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR", left: "←" },
          { value: "rtl", title: "RTL", right: "→" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    direction: "ltr",
  },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
  decorators: [
    (Story, context) => {
      const direction = context.globals.direction ?? "ltr";
      return React.createElement(
        "div",
        { dir: direction },
        React.createElement(Story)
      );
    },
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
