import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: ['node14'],
		format: ['cjs'],
		clean: true,
		minify: true,
		dts: options.dts,
		watch: options.watch,
		clean: false,
		deps: {
			neverBundle: [/kolorist|prompts/gm],
		},
	};
});
