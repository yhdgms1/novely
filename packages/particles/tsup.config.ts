import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/eager.ts', 'src/lazy.ts'],
		external: ['@novely/core'],
		noExternal: ['@tsparticles/engine', '@tsparticles/slim'],
		sourcemap: true,
		target: 'es2022',
		format: ['esm'],
		minify: true,
		bundle: true,
		splitting: true,
		dts: options.dts,
		watch: options.watch,
	};
});
