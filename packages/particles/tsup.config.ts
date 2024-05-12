import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		external: ['@novely/core'],
		noExternal: ['@tsparticles/engine', '@tsparticles/slim'],
		sourcemap: true,
		target: 'es2022',
		format: ['esm'],
		minify: true,
		bundle: true,
		splitting: false,
		dts: options.dts,
		watch: options.watch,
	};
});
