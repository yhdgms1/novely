import { untrack, batch } from 'solid-js';

const findLastIndex = <T>(array: T[], fn: (this: T[], item: T, index: number, array: T[]) => boolean) => {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn.call(array, array[i], i, array)) {
			return i;
		}
	}

	return -1;
};

/**
 * Using this because `Array.prototype.findLast` has not enough support
 * @see https://caniuse.com/?search=findLast
 */
const findLast = <T>(array: T[], fn: (this: T[], item: T, index: number, array: T[]) => boolean) => {
	return array[findLastIndex(array, fn)];
}

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
			await image.decode().catch(() => {})
		}

		resolve(true);
	});

	image.addEventListener('abort', () => {
		resolve(false);
	})

	image.addEventListener('error', () => {
		resolve(false);
	})

	return promise;
}

const createCanvas = () => {
	return document.createElement('canvas');
}

const getContext = (canvas: HTMLCanvasElement) => {
	return canvas.getContext('2d')!;
}

/**
 * Draws passed `images` array on a `canvas`
 */
const canvasDrawImages = async (canvas = createCanvas(), ctx = getContext(canvas), images: HTMLImageElement[]) => {
	await Promise.allSettled(images.map(image => imageLoaded(image)));

	if (canvas.dataset.resized === 'false' || !canvas.dataset.resized) {
		const sizesSorted = images.slice().sort((a, b) => b.width - a.width);
		const sizes = sizesSorted[0];

		canvas.width = sizes.naturalWidth;
		canvas.height = sizes.naturalHeight;

		canvas.dataset.resized = 'true';
	}

	for (const image of images) {
		ctx.drawImage(image, 0, 0);
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
	let css = ''

	for (const styleSheet of Array.from(document.styleSheets)) {
		if (!styleSheet.href || styleSheet.href.startsWith(location.origin)) {
			for (const { cssText } of Array.from(styleSheet.cssRules)) {
				css += cssText
			}
		}
	}

	return css;
}

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

export {
	isCSSImage,
	canvasDrawImages,
	url,
	createImage,
	capitalize,
	onKey,
	findLast,
	simple,
	getDocumentStyles,
	once,
	imageLoaded
};
