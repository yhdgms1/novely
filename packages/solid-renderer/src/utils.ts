import type { Stored } from '@novely/core';
import type { Atom } from '@novely/renderer-toolkit';
import { noop } from '@novely/renderer-toolkit';
import { batch, createSignal, onCleanup, untrack } from 'solid-js';
import { PRELOADED_IMAGE_MAP, PRELOADING_IMAGE_MAP } from './shared';

const capitalize = (str: string) => {
	return str[0].toUpperCase() + str.slice(1);
};

const isCSSImage = (str: string) => {
	const startsWith = String.prototype.startsWith.bind(str);

	return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
};

const createImage = (src: string) => {
	const img = document.createElement('img');

	Object.assign(img, {
		src,
	});

	return img;
};

const imageLoaded = (image: HTMLImageElement) => {
	const { promise, resolve } = Promise.withResolvers<boolean>();

	if (image.complete && image.naturalHeight !== 0) {
		resolve(true);

		return promise;
	}

	image.addEventListener('load', async () => {
		if (image.decode) {
			await image.decode().catch(noop);
		}

		resolve(true);
	});

	image.addEventListener('abort', () => {
		resolve(false);
	});

	image.addEventListener('error', () => {
		resolve(false);
	});

	return promise;
};

/**
 * Uses `PRELOADING_IMAGE_MAP` and `PRELOADED_IMAGE_MAP` for asset caching.
 * @param src Image source
 * @returns Loaded image
 */
const imagePreloadWithCaching = async (src: string) => {
	if (PRELOADING_IMAGE_MAP.has(src)) {
		const image = PRELOADING_IMAGE_MAP.get(src)!;

		await imageLoaded(image);

		PRELOADING_IMAGE_MAP.delete(src);
		PRELOADED_IMAGE_MAP.set(src, image);

		return image;
	}

	if (PRELOADED_IMAGE_MAP.has(src)) {
		const image = PRELOADED_IMAGE_MAP.get(src)!;

		return image;
	}

	const image = createImage(src);

	PRELOADING_IMAGE_MAP.set(src, image);

	await imageLoaded(image);

	PRELOADING_IMAGE_MAP.delete(src);
	PRELOADED_IMAGE_MAP.set(src, image);

	return image;
};

/**
 * Takes images from `PRELOADING_IMAGE_MAP` and `PRELOADED_IMAGE_MAP` cache. When no images were cached adds images to `PRELOADING_IMAGE_MAP`.
 * @param src Image source
 * @returns Image, load status is unknown
 */
const imagePreloadWithCachingNotComplete = (src: string) => {
	if (PRELOADING_IMAGE_MAP.has(src)) {
		PRELOADING_IMAGE_MAP.get(src)!;
	}

	if (PRELOADED_IMAGE_MAP.has(src)) {
		return PRELOADED_IMAGE_MAP.get(src)!;
	}

	const image = createImage(src);

	PRELOADING_IMAGE_MAP.set(src, image);

	return image;
};

const createCanvas = () => {
	return document.createElement('canvas');
};

const getContext = (canvas: HTMLCanvasElement) => {
	return canvas.getContext('2d')!;
};

/**
 * Draws passed `images` array on a `canvas`
 */
const canvasDrawImages = async (canvas = createCanvas(), ctx = getContext(canvas), images: HTMLImageElement[]) => {
	await Promise.allSettled(images.map((image) => imageLoaded(image)));

	if (canvas.dataset.resized === 'false' || !canvas.dataset.resized) {
		const sizesSorted = images.slice().sort((a, b) => b.width - a.width);
		const sizes = sizesSorted[0];

		const scaleBy = canvas.dataset.scaleBy ? Number(canvas.dataset.scaleBy) : 1;

		/**
		 * Scale down, but not so much
		 */
		canvas.width = Math.min(sizes.naturalWidth * scaleBy * 2, sizes.naturalWidth) * devicePixelRatio;
		canvas.height = Math.min(sizes.naturalHeight * scaleBy * 2, sizes.naturalHeight) * devicePixelRatio;

		canvas.dataset.resized = 'true';
	}

	for (const image of images) {
		/**
		 * In case images has different size, images with smaller size will be stretched to the canvas size
		 */
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	}

	return [canvas, ctx] as const;
};

const url = <T extends string>(str: T): `url(${T})` => {
	return `url(${str})`;
};

const onKey = (cb: (event: KeyboardEvent) => void, ...keys: string[]) => {
	return (e: KeyboardEvent) => {
		if (keys.some((key) => key === e.key)) {
			cb(e);
		}
	};
};

const simple = <T extends unknown[], R>(fn: (...args: T) => R) => {
	return (...args: T) => {
		let result!: R;

		batch(() => {
			untrack(() => {
				result = fn(...args);
			});
		});

		return result;
	};
};

const getDocumentStyles = () => {
	let css = '';

	for (const styleSheet of Array.from(document.styleSheets)) {
		if (!styleSheet.href || styleSheet.href.startsWith(location.origin)) {
			for (const { cssText } of Array.from(styleSheet.cssRules)) {
				css += cssText;
			}
		}
	}

	return css;
};

/**
 * A wrapper on `fn` to make it run only once!
 * @param fn Function that needed to run no more than one time
 */
const once = (fn: () => void) => {
	let ran = false;

	return () => {
		if (ran) return;

		ran = true;
		fn();
	};
};

const createRetrieved = <T>(fn: () => T) => {
	const key = Symbol();

	let value: typeof key | T = key;

	return () => {
		if (value === key) {
			value = fn();
		}

		return value;
	};
};

/**
 * Like solid-js's from, but has initial value
 */
const from = <T>(producer: Atom<T> | Stored<T>) => {
	const [s, set] = createSignal(producer.get(), {
		equals: false,
	});

	onCleanup(producer.subscribe(set));

	return s;
};

export {
	createRetrieved,
	isCSSImage,
	canvasDrawImages,
	url,
	createImage,
	capitalize,
	onKey,
	simple,
	getDocumentStyles,
	once,
	imageLoaded,
	imagePreloadWithCaching,
	imagePreloadWithCachingNotComplete,
	from,
};
