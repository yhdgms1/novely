import { memoize, once } from 'es-toolkit/function';
import { DEV } from 'esm-env';
import { supportsMap as audioSupport } from './audio-codecs';
import { HOWLER_SUPPORTED_FILE_FORMATS, SUPPORTED_IMAGE_FILE_FORMATS } from './constants';
import { supportsMap as imageSupport } from './image-formats';
import type { NovelyAsset } from './types';
import { getUrlFileExtension, isAsset } from './utilities';

const generateRandomId = () => Math.random().toString(36);

/**
 * Function to get assets type. All assets must be of the same type. Only works with supported types.
 */
const getType = memoize(
	(extensions: string[]) => {
		if (extensions.every((extension) => HOWLER_SUPPORTED_FILE_FORMATS.has(extension as any))) {
			return 'audio';
		}

		if (extensions.every((extension) => SUPPORTED_IMAGE_FILE_FORMATS.has(extension as any))) {
			return 'image';
		}

		if (DEV) {
			throw new Error(`Unsupported file extensions: ${JSON.stringify(extensions)}`)
		}

		throw extensions;
	},
	{
		getCacheKey: (extensions) => extensions.join('~'),
	},
);

const SUPPORT_MAPS = {
	image: imageSupport,
	audio: audioSupport,
} as const;

/**
 * This function uses array instead of spread because memoize only works with first argument
 */
const assetPrivate = memoize(
	(variants: string[]): NovelyAsset => {
		if (DEV && variants.length === 0) {
			throw new Error(`Attempt to use "asset" function without arguments`);
		}

		const map: Record<string, string> = {};
		const extensions: string[] = [];

		for (const v of variants) {
			const e = getUrlFileExtension(v);

			map[e] = v;
			extensions.push(e);
		}

		const type = getType(extensions);

		const getSource = once(() => {
			const support = SUPPORT_MAPS[type];

			for (const extension of extensions) {
				if (extension in support) {
					if (support[extension as keyof typeof support]) {
						return map[extension];
					}
				} else {
					return map[extension];
				}
			}

			if (DEV) {
				throw new Error(`No matching asset was found for ${variants.map((v) => `"${v}"`).join(', ')}`);
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
			id: generateRandomId(),
		};
	},
	{
		getCacheKey: (variants) => variants.join('~'),
	},
);

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
const asset = (...variants: string[]) => {
	return assetPrivate(variants);
};

asset.image = (source: string): NovelyAsset => {
	if (assetPrivate.cache.has(source)) {
		return assetPrivate.cache.get(source)!;
	}

	const asset = {
		type: 'image',
		source,
		id: generateRandomId(),
	} as NovelyAsset;

	assetPrivate.cache.set(source, asset);

	return asset;
};

asset.audio = (source: string): NovelyAsset => {
	if (assetPrivate.cache.has(source)) {
		return assetPrivate.cache.get(source)!;
	}

	const asset = {
		type: 'audio',
		source,
		id: generateRandomId(),
	} as NovelyAsset;

	assetPrivate.cache.set(source, asset);

	return asset;
};

const unwrapAsset = (asset: string | NovelyAsset) => {
	return isAsset(asset) ? asset.source : asset;
};

const unwrapAudioAsset = (asset: string | NovelyAsset) => {
	if (DEV && isAsset(asset) && asset.type !== 'audio') {
		throw new Error('Attempt to use non-audio asset in audio action', { cause: asset });
	}

	return unwrapAsset(asset);
};

const unwrapImageAsset = (asset: string | NovelyAsset) => {
	if (DEV && isAsset(asset) && asset.type !== 'image') {
		throw new Error('Attempt to use non-image asset in action that requires image assets', { cause: asset });
	}

	return unwrapAsset(asset);
};

export { asset, unwrapAsset, unwrapAudioAsset, unwrapImageAsset };
