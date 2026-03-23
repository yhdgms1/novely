import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
	return {
		entry: ['src/eager.ts', 'src/lazy.ts'],
		sourcemap: true,
		target: 'es2024',
		minify: true,
		splitting: true,
		dts: options.dts,
		watch: options.watch,
		clean: false,
		deps: {
			neverBundle: ['@tsparticles/engine', '@tsparticles/slim'],
		},
	};
});
