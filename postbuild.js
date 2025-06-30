import fs from 'node:fs/promises';
import path from 'node:path';

const distPath = path.resolve(import.meta.dirname, 'dist');

const assetsJson = await fs.readFile(path.resolve(import.meta.dirname, 'src', 'fetch-assets-keys.ts'), 'utf-8').then((content) => content.slice(23, -1));
const assets = JSON.parse(assetsJson);

for (const asset of assets) {
  await fs.rm(path.resolve(distPath, asset), { force: true })
}
