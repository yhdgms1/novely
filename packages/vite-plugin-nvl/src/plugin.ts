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
	/**
	 * Use with statement to get $values1 values
	 * @default false
	 */
	useWith?: boolean;
}

const defaults = {
	extensions: ['.nvly', '.novely', '.nvl', '.nly'],
	rewrites: {
		диалог: 'dialog',
		ввод: 'input',
		выбор: 'choice',
	},
	useWith: false,
};

const novelyPlugin = ({
	extensions = defaults.extensions,
	rewrites = defaults.rewrites,
	useWith = defaults.useWith,
}: PluginOptions = {}) => {
	const plugin: Plugin = {
		name: 'vite-plugin-nvl',
		async load(id) {
			if (extensions.some((ending) => id.endsWith(ending))) {
				const contents = await fs.readFile(id, 'utf8');
				const ast = parse(contents);
				const func = transform(ast, {
					rewrites,
					useWith,
				});

				return `export default ${func}`;
			}

			return null;
		},
	};

	return plugin;
};

/**
 * @deprecated use novelyPlugin instead
 */
const plugin = novelyPlugin();

export { novelyPlugin, plugin };
