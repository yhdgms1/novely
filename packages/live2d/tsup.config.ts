import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		external: ['@novely/core', 'easy-cl2d'],
		sourcemap: true,
		target: 'es2024',
		format: ['esm'],
		minify: true,
		bundle: true,
		splitting: true,
		dts: options.dts,
		watch: options.watch,
	};
});
