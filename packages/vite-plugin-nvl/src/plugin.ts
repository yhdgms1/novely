import type { Plugin } from 'vite';
import { parse, transform } from '@novely/parser';
import fs from 'fs/promises';

const plugin: Plugin = {
  name: 'vite-plugin-nvl',
  async load(id) {
    if ([".nvly", ".nvl", ".nly"].some(ending => id.endsWith(ending))) {
      const contents = await fs.readFile(id, 'utf8');
      const ast = parse(contents);
      const func = transform(ast);

      return `export default ${func}`;
    }

    return null;
  }
}

export { plugin }