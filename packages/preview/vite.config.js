import { novelyPlugin } from '@novely/vite-plugin-novely';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [novelyPlugin()],
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
		open: true,
	},
	base: './',
});
