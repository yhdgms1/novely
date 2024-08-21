import { defineConfig } from 'vite';
import { novelyPlugin } from '@novely/vite-plugin-novely';

export default defineConfig({
	plugins: [
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
	server: {
		open: true
	},
	base: './',
});
