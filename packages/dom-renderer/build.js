import { build } from "esbuild";
import { compileJSXPlugin, defineConfig as defineGrimConfig } from "grim-jsx";
import { default as babel } from "esbuild-plugin-babel";

const dev = process.argv.at(2) === "--watch";

build({
  entryPoints: ["./src/index.ts"],
  external: [],
  charset: "utf8",
  jsx: "preserve",
  platform: "browser",
  format: "esm",
  outdir: "./dist",
  bundle: true,
  watch: dev,
  plugins: [
    babel({
      filter: /.[tj]sx$/g,
      config: {
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
});
