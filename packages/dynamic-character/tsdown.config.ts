import { defineConfig } from 'tsdown';
import solidPlugin from 'rolldown-plugin-solid';

export default defineConfig((options) => {
	return {
		entry: ['./src/index.ts', './src/style.css'],
		sourcemap: true,
		target: 'esnext',
		minify: false,
		platform: 'browser',
		dts: true,
		watch: options.watch,
		plugins: [solidPlugin()],
		deps: {
			neverBundle: ['solid-js', 'p-limit'],
		},
	};
});
