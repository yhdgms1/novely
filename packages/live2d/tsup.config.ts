import { defineConfig } from 'tsup';

export default defineConfig((options) => {
	return {
		entry: ['src/index.ts'],
		external: ['@novely/core'],
		noExternal: [
			'@pixi/app',
			'@pixi/constants',
			'@pixi/core',
			'@pixi/extensions',
			'@pixi/interaction',
			'@pixi/math',
			'@pixi/runner',
			'@pixi/settings',
			'@pixi/ticker',
			'@pixi/utils',
			'pixi-live2d-display',
		],
		sourcemap: true,
		target: 'es2022',
		format: ['esm'],
		minify: true,
		bundle: true,
		splitting: true,
		dts: options.dts,
		watch: options.watch,
		clean: true,
		esbuildOptions: (options) => {
			options.legalComments = 'none';
		},
	};
});
