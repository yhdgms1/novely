import * as esbuild from 'esbuild';
import { cssPlugin } from '../../env/index.js';
import { solidPlugin } from 'esbuild-plugin-solid';

const dev = process.argv.at(2) === '--watch';

const context = await esbuild.context({
	entryPoints: ['./src/index.ts', './src/styles/index.css'],
	external: [],
	charset: 'utf8',
	jsx: 'preserve',
	platform: 'browser',
	format: 'esm',
	outdir: './dist',
	outExtension: {
		'.js': '.jsx',
	},
	bundle: true,
	plugins: [
		cssPlugin({
			loader: 'css',
			minify: false,
		}),
		solidPlugin({
			babel: {
				babelrc: false,
				browserslistConfigFile: false,
				configFile: false,
				highlightCode: false,
				plugins: [],
			},
		}),
	],
});

if (dev) {
	context.watch();
} else {
	await context.rebuild();
	context.dispose();
}
