import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: 'es2022',
		format: ['esm'],
		minify: true,
		dts: options.dts,
		watch: options.watch,
	};
});
