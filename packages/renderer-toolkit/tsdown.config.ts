import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: 'es2024',
		format: ['esm'],
		minify: false,
		dts: true,
		clean: false,
		watch: options.watch,
	};
});
