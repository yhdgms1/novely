import { novelyPlugin } from '@novely/vite-plugin-novely';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [novelyPlugin()],
	build: {
		modulePreload: false,
		rolldownOptions: {
			output: {
				manualChunks: (id) => {
					return null;
				},
			},
		},
	},
	server: {
		open: true,
	},
	base: './',
});
