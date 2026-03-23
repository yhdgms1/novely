import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		sourcemap: true,
		target: 'es2024',
		minify: false,
		dts: options.dts,
		clean: false,
		watch: options.watch,
	};
});
