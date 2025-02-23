import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		external: [],
		noExternal: ['klona', 'dequal'],
		sourcemap: true,
		target: 'es2024',
		format: ['esm'],
		bundle: true,
		minify: false,
		dts: true,
		watch: options.watch,
		esbuildOptions: (options) => {
			options.charset = 'utf8'
		}
	};
});
