import { defineConfig } from "vite";
import { default as solidPlugin } from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          return null;
        },
      },
    },
  },
  esbuild: {
    legalComments: "none",
    charset: "utf8",
  },
});
