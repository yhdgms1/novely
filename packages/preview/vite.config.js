import { defineConfig } from 'vite';
import { default as solidPlugin } from 'vite-plugin-solid';
import { plugin as pluginNvl } from '@novely/vite-plugin-nvl';

export default defineConfig({
	plugins: [
		solidPlugin({
			hot: false,
		}),
		pluginNvl,
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
});
