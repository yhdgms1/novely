import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entry: ["src/index.ts"],
    external: [],
    sourcemap: true,
    target: "es2022",
    format: ["esm"],
    minify: false,
    bundle: true,
    dts: options.dts,
    watch: options.watch,
  };
});
