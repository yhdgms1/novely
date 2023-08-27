import { defineConfig } from 'vite'
import { novelyPlugin } from '@novely/vite-plugin-nvl'
import pluginSSL from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
	const dev = mode.includes('development');

	return {
		plugins: [
			/**
			 * Plugin for special story file format
			 */
			novelyPlugin({
				/**
				 * Plugin will use `with` statement for values
				 */
				useWith: false,
				/**
				 * Can be used to map one action to another one, can be used for writing in cyrillic
				 */
				rewrites: {}
			}),
			/**
			 * Enable only in dev mode
			 */
			dev && pluginSSL()
		],
		build: {
			cssCodeSplit: false,
			target: ['chrome75', 'safari13'],
		},
		server: {
			https: dev
		},
		esbuild: {
			charset: 'utf8',
		},
		/**
		 * Relative path is required
		 */
		base: './',
	}
})
