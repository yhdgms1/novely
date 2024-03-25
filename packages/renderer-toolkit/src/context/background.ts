import { findLast } from "../utils";

const toMedia = (media: 'portrait' | 'landscape' | (string & Record<never, never>)) => {
	if (media === 'portrait' || media === 'landscape') {
		return `(orientation: ${media})`;
	}

	return media;
};

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

	/**
	 * In case this will be immideately disposed `handle` call is put in Promise
	 */
	Promise.resolve().then(() => {
		if (disposed) return;

		handle();
	})

	return {
		/**
		 * Remove all listeners
		 */
		dispose() {
			for (const mq of mediaQueries) {
				mq.onchange = null;
			}

			disposed = true;
		}
	}
}

export { useBackground }
