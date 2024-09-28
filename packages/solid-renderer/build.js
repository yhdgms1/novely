import { exec } from 'child_process';
import { watch } from 'fs';
import * as esbuild from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid';
import { cssPlugin } from '../../env/index.js';

const dev = process.argv.at(2) === '--w';

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

	/** @type {import('child_process').ChildProcess | null} */
	let tscProcess = null;

	const restartTsc = () => {
		if (tscProcess) {
			tscProcess.kill();
		}

		tscProcess = exec('tsc', (error, stdout, stderr) => {
			if (error) {
				console.error(error.message);
			}

			if (stderr) {
				console.error(stderr);
			}
		});
	};

	watch('./src', { recursive: true }, async () => {
		restartTsc();
	});
} else {
	await context.rebuild();
	context.dispose();
}
