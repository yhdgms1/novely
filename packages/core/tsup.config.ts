import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		external: [],
		noExternal: ['deepmerge', 'klona', '@novely/deepmerge'],
		sourcemap: true,
		target: 'es2022',
		format: ['esm', 'iife'],
		bundle: true,
		minify: false,
		dts: true,
		watch: options.watch,
		globalName: 'Novely',
	};
});
