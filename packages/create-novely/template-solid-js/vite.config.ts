import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import { novelyPlugin } from '@novely/vite-plugin-novely'

export default defineConfig(() => {
	return {
		plugins: [
			/**
			 * Plugin for special story file format
			 */
			novelyPlugin(),
		],
		build: {
			cssCodeSplit: false,
			target: ['chrome75', 'safari13'],
		},
		esbuild: {
			charset: 'utf8',
		},
		/**
		 * Games is hosted on different resources, sometimes relative path is required
		 */
		base: './',
	} satisfies UserConfig;
})
