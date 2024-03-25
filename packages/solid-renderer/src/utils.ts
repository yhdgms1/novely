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
		crossOrigin: '*'
	});

	return img;
};

/**
 * Рисует `images` на `canvas`
 */
const canvasDrawImages = (
	canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d')!,
	images: HTMLImageElement[],
) => {
	let set = false;

	for (const image of images) {
		const isLoaded = image.complete && image.naturalHeight !== 0;

		const draw = () => {
			if (!set) (set = true), (canvas.width = image.naturalWidth), (canvas.height = image.naturalHeight);

			ctx.drawImage(image, 0, 0);
			image.removeEventListener('load', draw);
		};

		isLoaded ? draw() : image.addEventListener('load', draw);
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
};
