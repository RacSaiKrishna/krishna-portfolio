import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Caption files must be real URLs: browsers can refuse data: URLs for <track>.
    assetsInlineLimit: (file) => (file.endsWith(".vtt") ? false : undefined),
  },
});
