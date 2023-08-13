import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const lightning = require('lightningcss');

/**
 * @typedef {Object} CSSPluginOptions
 * @property {import('esbuild').Loader?} loader
 * @property {boolean?} minify
 */

/**
 * ESBuild Plugin for CSS
 * @param {CSSPluginOptions} options
 * @returns {import('esbuild').Plugin}
 */
export const cssPlugin = ({ loader = 'css', minify = false }) => {
  return {
    name: 'css',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const contents = await readFile(args.path, 'utf8');

        const { code } = lightning.transform({
          minify,
          sourceMap: false,
          code: Buffer.from(contents),
          targets: {
            safari: (12 << 16) | (0 << 8),
          },
        });

        return {
          loader,
          contents: code.toString('utf8'),
        }
      })
    }
  }
}
