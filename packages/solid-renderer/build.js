import { build } from 'esbuild';

const dev = process.argv.at(2) === '--watch';

build({
	entryPoints: ['./src/index.ts', './src/styles/index.css'],
	external: ['solid-js'],
	charset: 'utf8',
	jsx: 'preserve',
	platform: 'browser',
	format: 'esm',
	outdir: './dist',
	outExtension: {
		'.js': '.jsx',
	},
	bundle: true,
	watch: dev,
});
