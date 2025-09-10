import "@milkdown/crepe/theme/common/style.css";
import type { Preview } from "@storybook/nextjs-vite";
import "../src/styles/crepe-nord.css";
import "../src/app/globals.css";
import { initialize, mswLoader } from "msw-storybook-addon";

// Initialize MSW
initialize();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    loaders: [mswLoader], // Provide MSW loader to intercept requests
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
