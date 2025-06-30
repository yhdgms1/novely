import fs from 'node:fs/promises';
import path from 'node:path';

const publicPath = path.resolve(import.meta.dirname, 'public');
const publicDir = await fs.readdir(publicPath, { recursive: true, withFileTypes: true });

const cubismDirs = publicDir
  .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.model3.json'))
  .map((dirent) => dirent.parentPath);

/**
 * @type {[key: string, value: Record<string, any>][]}
 */
const cache = [];

for (const dir of cubismDirs) {
  const subDirs = publicDir.filter((dirent) => dirent.parentPath.startsWith(dir));
  const entries = subDirs.filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json'));

  for (const entry of entries) {
    const filePath = path.resolve(entry.parentPath, entry.name);
    const file = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(file);

    const size = new Blob([JSON.stringify(json)]).size;

    if (entry.parentPath === dir || size <= 32 * 1024) {
      const name = filePath.replace(publicPath, '').slice(1).replaceAll(path.win32.sep, path.posix.sep);

      cache.push([name, json])
    }
  }
}

const jsPath = path.resolve(import.meta.dirname, 'src', 'fetch-assets.ts');
const js = `export default new Map(${JSON.stringify(cache)})`;

await fs.writeFile(jsPath, js, 'utf-8');

const keysPath = path.resolve(import.meta.dirname, 'src', 'fetch-assets-keys.ts');
const keys = `export default new Set(${JSON.stringify(cache.map(([key]) => key))})`;

await fs.writeFile(keysPath, keys, 'utf-8');
