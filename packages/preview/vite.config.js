import { defineConfig } from 'vite';
import { default as solidPlugin } from 'vite-plugin-solid';
import { novelyPlugin } from '@novely/vite-plugin-nvl';

export default defineConfig({
	plugins: [
		solidPlugin({
			babel: {
				babelrc: false,
				browserslistConfigFile: false,
				configFile: false,
				highlightCode: false,
				plugins: [],
			},
			hot: false,
		}),
		novelyPlugin(),
	],
	build: {
		modulePreload: false,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					return null;
				},
			},
		},
	},
	esbuild: {
		legalComments: 'none',
		charset: 'utf8',
	},
	base: './'
});
