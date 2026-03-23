import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: 'esnext',
		minify: true,
		splitting: true,
		dts: options.dts,
		watch: options.watch,
		clean: false,
		deps: {
			neverBundle: ['@novely/core', 'easy-cl2d'],
		},
	};
});
