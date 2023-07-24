import * as esbuild from 'esbuild';
import * as lightning from 'lightningcss';
import * as fs from 'fs/promises';

const dev = process.argv.at(2) === '--watch';

const context = await esbuild.context({
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
	plugins: [
		{
			name: 'css',
			setup(build) {
				build.onLoad({ filter: /\.css$/ }, async (args) => {
					const contents = await fs.readFile(args.path, 'utf-8');

					const { code } = lightning.transform({
						code: Buffer.from(contents),
						minify: false,
						sourceMap: false,
						targets: {
							safari: (12 << 16) | (0 << 8),
						},
					});

					const css = code.toString('utf-8');

					return {
						contents: css,
						loader: 'css',
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
