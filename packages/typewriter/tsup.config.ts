import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entry: ["src/index.ts"],
    sourcemap: true,
    target: "es2022",
    format: ["esm"],
    minify: false,
    dts: options.dts,
    watch: options.watch,
  };
});
