import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import { novelyPlugin } from '@novely/vite-plugin-novely'
import pluginSSL from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
	const dev = mode.includes('development')

	return {
		plugins: [
			/**
			 * Plugin for special story file format
			 */
			novelyPlugin(),
			/**
			 * Enable only in dev mode
			 */
			dev && pluginSSL(),
		],
		build: {
			cssCodeSplit: false,
			target: ['chrome75', 'safari13'],
		},
		esbuild: {
			charset: 'utf8',
		},
		/**
		 * Relative path is required
		 */
		base: './',
	} satisfies UserConfig;
})
