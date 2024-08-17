import { findLast } from "../utils";

const useBackground = (backgrounds: Record<string, string>, set: (bg: string) => void) => {
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
