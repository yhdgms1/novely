import { defineConfig } from "vite";
import { im } from "@artemis69/im";
import { compileJSXPlugin, defineConfig as defineGrimConfig } from "grim-jsx";
import { default as babel } from "vite-plugin-babel";

const babelPlugin = im(babel);

export default defineConfig({
  plugins: [
    babelPlugin({
      filter: /.[tj]sx$/g,
      babelConfig: {
        babelrc: false,
        browserslistConfigFile: false,
        plugins: [
          [
            compileJSXPlugin,
            defineGrimConfig({
              enableStringMode: false,
              enableCommentOptions: false,
            }),
          ],
        ],
        presets: ["@babel/preset-typescript"],
      },
    }),
  ],
  build: {
    modulePreload: false,
  },
  esbuild: {
    jsx: "preserve",
    legalComments: "none",
  },
});
