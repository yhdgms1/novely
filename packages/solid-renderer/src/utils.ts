import { untrack, batch } from 'solid-js';

const capitalize = (str: string) => {
	return str[0].toUpperCase() + str.slice(1);
};

const isCSSImage = (str: string) => {
	const startsWith = String.prototype.startsWith.bind(str);

	return startsWith('http') || startsWith('/') || startsWith('.') || startsWith('data');
};

const createImage = (src: string) => {
	const img = document.createElement('img');

	return (img.src = src), (img.crossOrigin = '*'), img;
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

const escaped: Record<string, string> = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
};

const escape = (str: string) => {
	return String(str).replace(/["'&<>]/g, (match) => escaped[match]);
};

const onKey = (cb: (event: KeyboardEvent) => void, ...keys: string[]) => {
	return (e: KeyboardEvent) => {
		if (keys.some((key) => key === e.key)) {
			cb(e);
		}
	};
};

const toMedia = (media: 'portrait' | 'landscape' | (string & Record<never, never>)) => {
	if (media === 'portrait' || media === 'landscape') {
		return `(orientation: ${media})`;
	}

	return media;
};

/**
 * Using ponyfill here because `Array.prototype.findLast` has not enough support
 * @see https://caniuse.com/?search=findLast
 */
const findLast = <T>(array: T[], fn: (item: T) => boolean) => {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i])) {
			return array[i];
		}
	}

	return;
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

const vibrationPossible = (() => {
	let can = false;

	const onPointerDown = () => {
		can = true;
		document.removeEventListener('pointerdown', onPointerDown);
	};

	document.addEventListener('pointerdown', onPointerDown);

	return () => can;
})();

const vibrate = (pattern: VibratePattern) => {
	if (vibrationPossible() && 'vibrate' in navigator) {
		try {
			navigator.vibrate(pattern);
		} catch {}
	}
}

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

const useBackground = (obj: Record<string, string>, set: (bg: string) => void) => {
	/**
	 * Changes `portrait` to `(orientation: portrait)` and same for `landscape`
	 */
	const backgrounds = Object.fromEntries(Object.entries(obj).map(([key, value]) => [toMedia(key), value]))

	const mediaQueries = Object.keys(backgrounds).map((media) => matchMedia(media));
	const allMedia = mediaQueries.find(({ media }) => media === 'all');

	const handle = () => {
		const last = findLast(mediaQueries, ({ matches, media }) => matches && media !== 'all');
		const bg = last
			? backgrounds[last.media]
			: allMedia
				? backgrounds['all']
				: '';

		set(bg);
	};

	for (const mq of mediaQueries) {
		mq.onchange = handle;
	}

	let disposed = false;

	Promise.resolve().then(() => {
		if (disposed) return;

		handle();
	})

	return {
		/**
		 * Remove all listeners and etc
		 */
		dispose() {
			for (const mq of mediaQueries) {
				mq.onchange = null;
			}

			disposed = true;
		}
	}

}

export {
	isCSSImage,
	canvasDrawImages,
	url,
	createImage,
	capitalize,
	escape,
	onKey,
	toMedia,
	findLast,
	simple,
	vibrationPossible,
	vibrate,
	getDocumentStyles,
	useBackground
};
