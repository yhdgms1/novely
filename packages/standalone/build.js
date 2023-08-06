import * as esbuild from 'esbuild';
import * as lightning from 'lightningcss';
import * as fs from 'fs/promises';
import { solidPlugin } from 'esbuild-plugin-solid';

const dev = process.argv.at(2) === '--watch';

const context = await esbuild.context({
	entryPoints: ['./src/index.tsx'],
	external: [],
	charset: 'utf8',
	platform: 'browser',
	format: 'iife',
	outdir: './dist',
	loader: {
		'.css': 'text'
	},
	bundle: true,
	minify: true,
	plugins: [
		solidPlugin(),
		{
			name: 'css',
			setup(build) {
				build.onLoad({ filter: /\.css$/ }, async (args) => {
					const contents = await fs.readFile(args.path, 'utf-8');

					const { code } = lightning.transform({
						code: Buffer.from(contents),
						minify: true,
						sourceMap: false,
						targets: {
							safari: (12 << 16) | (0 << 8),
						},
					});

					const css = code.toString('utf-8');

					return {
						contents: css,
						loader: 'text',
					}
				})
			}
		}
	]
});

if (dev) {
	context.watch()
} else {
	await context.rebuild();
	context.dispose();
}
