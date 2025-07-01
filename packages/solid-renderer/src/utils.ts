import type { Stored } from '@novely/core';
import type { Atom } from '@novely/renderer-toolkit';
import { batch, createSignal, onCleanup, untrack } from 'solid-js';

const capitalize = (str: string) => {
	return str[0].toUpperCase() + str.slice(1);
};

const isCSSImage = (str: string) => {
	const startsWith = String.prototype.startsWith.bind(str);

	return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
};

const createImageSync = (src: string) => {
	const image = document.createElement('img');

	image.src = src;

	return image;
};

const createImage = (src: string) => {
	const { promise, resolve } = Promise.withResolvers<HTMLImageElement | null>();
	const image = document.createElement('img');

	image.addEventListener('load', () => {
		resolve(image);
	});

	image.addEventListener('abort', () => {
		resolve(null);
	});

	image.addEventListener('error', () => {
		resolve(null);
	});

	image.src = src;

	if (image.complete) {
		resolve(image.naturalHeight === 0 ? null : image);
	}

	return promise;
};

const waitForImage = (image: HTMLImageElement) => {
	const { promise, resolve } = Promise.withResolvers<boolean>();

	if (image.complete) {
		resolve(image.naturalHeight !== 0);
	}

	image.addEventListener('load', () => {
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
	await Promise.allSettled(images.map((image) => waitForImage(image)));

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

const removeTagsFromHTML = (html: string) => {
	const container = document.createElement('div');

	container.innerHTML = html;

	return container.textContent || '';
};

export {
	createRetrieved,
	isCSSImage,
	canvasDrawImages,
	url,
	capitalize,
	onKey,
	simple,
	getDocumentStyles,
	once,
	from,
	removeTagsFromHTML,
	createImageSync,
	createImage,
	waitForImage,
};
