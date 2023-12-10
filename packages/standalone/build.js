import * as esbuild from 'esbuild';
import { cssPlugin } from '../../env/index.js';

const dev = process.argv.at(2) === '--watch';

const context = await esbuild.context({
	entryPoints: ['./src/index.tsx'],
	external: [],
	charset: 'utf8',
	platform: 'browser',
	format: 'iife',
	outdir: './dist',
	loader: {
		'.css': 'text',
	},
	bundle: true,
	minify: true,
	plugins: [
		cssPlugin({
			loader: 'text',
			minify: true,
		}),
	],
});

if (dev) {
	context.watch();
} else {
	await context.rebuild();
	context.dispose();
}
