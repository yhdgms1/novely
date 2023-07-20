import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: ['node14'],
		format: ['cjs'],
		clean: true,
		minify: true,
		bundle: true,
		dts: options.dts,
		watch: options.watch,
		noExternal: [/kolorist|prompts/gm],
	};
});
