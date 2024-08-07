import type { NovelyAsset } from './types';
import { DEV } from 'esm-env';
import { getUrlFileExtension } from './utils';
import { supportsMap as audioSupport } from './audio-codecs';
import { supportsMap as imageSupport } from './image-formats';
import { HOWLER_SUPPORTED_FILE_FORMATS, SUPPORTED_IMAGE_FILE_FORMATS } from './constants';
import { default as memoize } from 'micro-memoize';

/**
 * Function to get assets type. All assets must be of the same type. Only works with supported types.
 */
const getType = memoize((extensions: string[]) => {
  if (extensions.every((extension) => HOWLER_SUPPORTED_FILE_FORMATS.has(extension as any))) {
    return 'audio';
  }

  if (extensions.every((extension) => SUPPORTED_IMAGE_FILE_FORMATS.has(extension as any))) {
    return 'image';
  }

  throw extensions;
})

/**
 * Memoizes and returns an asset selection object based on provided file variants.
 * The selected asset depends on the client's support for various formats.
 *
 * @param {...string} variants - A variable number of strings, each representing a potential asset file URL.
 * @returns {NovelyAsset} An object representing the selected asset with `source` and `type` properties.
 *
 * @throws {Error} If in DEV mode and no arguments are provided.
 * @example
 * ```
 * import { asset } from 'novely';
 *
 * // Passed first have higher priority
 * const classroom = asset(
 *   'classroom.avif',
 *   'classroom.webp',
 *   'classroom.jpeg'
 * );
 *
 * setTimeout(() => {
 *   console.log(classroom.source);
 * }, 100);
 * ```
 */
const asset = memoize((...variants: string[]): NovelyAsset => {
  if (DEV && variants.length === 0) {
    throw new Error(`Attempt to use "asset" function without arguments`)
  }

  const map: Record<string, string> = {};
  const extensions: string[] = [];

  for (const v of variants) {
    const e = getUrlFileExtension(v);

    map[e] = v;
    extensions.push(e);
  }

  const type = getType(extensions);

  const getSource = memoize(() => {
    if (type === 'image') {
      for (const extension of extensions) {
        if (extension in imageSupport) {
          if (imageSupport[extension as keyof typeof imageSupport]) {
            return map[extension];
          }

        } else {
          return map[extension];
        }
      }
    } else if (type === 'audio') {

      for (const extension of extensions) {
        if (extension in audioSupport) {
          if (audioSupport[extension as keyof typeof audioSupport]) {
            return map[extension];
          }
        } else {
          return map[extension];
        }
      }
    }

    if (DEV) {
      throw new Error(`No matching asset was found for ${variants.map(v => `"${v}"`).join(', ')}`)
    }

    return '';
  });

  return {
    get source() {
      return getSource();
    },
    get type() {
      return type;
    },
  }
})

const isAsset = (suspect: unknown): suspect is NovelyAsset => {
  return suspect !== null && typeof suspect === 'object' && 'source' in suspect && 'type' in suspect;
}

export { isAsset, asset }
