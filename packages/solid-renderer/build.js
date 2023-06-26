import { build } from "esbuild";
import { default as cssModulesPlugin } from "esbuild-css-modules-plugin";

const dev = process.argv.at(2) === "--watch";

build({
  entryPoints: ["./src/index.ts"],
  external: ["solid-js"],
  charset: "utf8",
  jsx: "preserve",
  platform: "browser",
  format: "esm",
  outdir: "./dist",
  outExtension: {
    ".js": ".jsx",
  },
  bundle: true,
  plugins: [
    cssModulesPlugin({
      v2: true,
      v2CssModulesOption: {
        pattern: "n-[local]",
      },
    }),
  ],
  watch: dev,
});
