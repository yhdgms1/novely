import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import { novelyPlugin } from '@novely/vite-plugin-nvl'

export default defineConfig(() => {
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
				rewrites: {},
			}),
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
