import { defineConfig } from 'tsdown';
import solidPlugin from 'rolldown-plugin-solid';

export default defineConfig((options) => {
	return {
		entry: ['./src/index.ts', './src/styles/index.css'],
		sourcemap: true,
		target: 'esnext',
		minify: false,
		platform: 'browser',
		dts: true,
		watch: options.watch,
		clean: false,
		plugins: [solidPlugin()],
		deps: {
			neverBundle: ['es-toolkit'],
		},
	};
});
