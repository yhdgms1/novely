import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: 'esnext',
		minify: false,
		dts: true,
		watch: options.watch,
		clean: false,
		deps: {
			neverBundle: ['klona', 'dequal'],
		},
	};
});
