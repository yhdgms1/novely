import { DEV, BROWSER } from 'esm-env';
import { avif, jxl, webp } from './constants';

// todo: remove when support is enough
import '@ungap/with-resolvers';

type ImageFormat = 'avif' | 'jxl' | 'webp' | 'fallback';

const selectionCache = new Map<string, string>();

const supportsFormat = (source: string) => {
	return new Promise<boolean>((resolve) => {
		const img = Object.assign(document.createElement('img'), {
			src: source
		})

		img.onload = img.onerror = () => {
			resolve(img.height === 2);
		}
	})
}

const supportsMap = {
	avif: false,
	jxl: false,
	webp: false
}

const formatsMap = {
	avif,
	jxl,
	webp
} as const;

const { promise: formatsSupportChecked, resolve: formatsSupportCheckedResolve } = Promise.withResolvers<void>();

let formatsSupportCheckedCount = 0;

for (const [format, source] of Object.entries(formatsMap)) {
	supportsFormat(source).then((supports) => {
		supportsMap[format as keyof typeof supportsMap] = supports;
		formatsSupportCheckedCount += 1;

		if (formatsSupportCheckedCount === Object.keys(formatsMap).length) {
			formatsSupportCheckedResolve();
		}
	})
}

let priority: ImageFormat[] = ['jxl', 'avif', 'webp', 'fallback']

/**
 * Set's the priority of formats for the selectFormat function
 * ```ts
 * // Prefer jxl over avif, avif over webp, webp over fallback
 * // But select fallback if others are not supported
 * setPriority('jxl', 'avif', 'webp', 'fallback')
 * ```
 * @param order Priority from first to last
 */
const setPriority = (...order: ImageFormat[]) => {
	priority = order;
}

const selectFormatPrivate = (imageSet: Partial<Record<ImageFormat, string>>) => {
	for (const format of priority) {
		if (imageSet[format] && supportsMap[format as keyof typeof supportsMap]) {
			return imageSet[format]!;
		}
	}

	if (!imageSet.fallback) {
		throw new Error('@novely/image-format-selector: No fallback format provided for image selection, other formats did not matched.')
	}

	return imageSet.fallback!;
}

/**
 * Selects preferred format.
 *
 * ```ts
 * const engine = novely({
 *  characters: {
 *   Lily: {
 *     name: 'Lily',
 *     color: 'red',
 *     emotions: {
 *       // Use getter
 *       get cheerful() {
 *         return selectFormat({
 *           webp: 'path-to-webp.webp',
 *           fallback: 'path-to-fallback.jpg'
 *         })
 *       }
 *     }
 *   }
 *  }
 * })
 * ```
 */
const selectFormat = (imageSet: Partial<Record<ImageFormat, string>>) => {
	if (DEV && !BROWSER) {
		throw new Error('@novely/image-format-selector: Cannot select format in not browser environment.');
	}

	if (DEV && Object.keys(imageSet).length === 0) {
		throw new Error('@novely/image-format-selector: No image formats provided for selection.');
	}


	const key = Object.values(imageSet).join('/*/');
	const cached = selectionCache.get(key);

	if (cached) {
		return cached;
	}

	const image = selectFormatPrivate(imageSet);

	selectionCache.set(key, image);

	return image;
}

export { setPriority, selectFormat, formatsSupportChecked }
