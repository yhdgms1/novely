import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { novelyPlugin } from '@novely/vite-plugin-novely';
import { default as legacyPlugin } from '@vitejs/plugin-legacy';
import { imagetools as imagetoolsPlugin } from 'vite-imagetools';

export default defineConfig(() => {
	return {
		plugins: [
			novelyPlugin(),
			legacyPlugin(),
			imagetoolsPlugin(),
		],
		build: {
			cssCodeSplit: false,
		},
		esbuild: {
			charset: 'utf8',
			legalComments: 'none'
		},
		base: './',
		server: {
			host: '0.0.0.0',
		}
	} satisfies UserConfig;
});
