import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    clean: true,
    sourcemap: true,
    target: 'es2022',
    format: ['esm'],
    dts: options.dts,
    watch: options.watch,
  }
})