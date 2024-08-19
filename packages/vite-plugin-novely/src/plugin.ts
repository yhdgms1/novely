import type { Plugin } from 'vite';
import { parse, transform } from '@novely/parser';
import fs from 'fs/promises';

interface PluginOptions {
	/**
	 * Extensions for plugin to handle
	 */
	extensions?: string[];
	/**
	 * Rewrite action names
	 */
	rewrites?: Record<string, string>;
}

const defaults = {
	extensions: ['.novely'],
	rewrites: {},
};

/**
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import { novelyPlugin } from 'vite-plugin-novely';
 *
 * export default defineConfig({
 *   plugins: [
 *     novelyPlugin()
 *   ]
 * })
 * ```
 */
const novelyPlugin = ({
	extensions = defaults.extensions,
	rewrites = defaults.rewrites,
}: PluginOptions = {}) => {
	const plugin: Plugin = {
		name: 'vite-plugin-nvl',
		async load(id) {
			if (extensions.some((ending) => id.endsWith(ending))) {
				const contents = await fs.readFile(id, 'utf8');
				const ast = parse(contents);
				const func = transform(ast, {
					rewrites,
				});

				return `export default ${func}`;
			}

			return null;
		},
	};

	return plugin;
};

export { novelyPlugin };
