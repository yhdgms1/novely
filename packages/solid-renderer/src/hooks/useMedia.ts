import { createSignal, onCleanup } from 'solid-js';

const useMedia = (media: string) => {
	const mq = matchMedia(media);

	const [matches, setMatches] = createSignal(mq.matches);

	const handleChange = (e: MediaQueryListEvent) => {
		setMatches(e.matches);
	};

	typeof mq.addEventListener === 'function'
		? mq.addEventListener('change', handleChange)
		: mq.addListener(handleChange);

	onCleanup(() => {
		typeof mq.removeEventListener === 'function'
			? mq.removeEventListener('change', handleChange)
			: mq.removeListener(handleChange);
	});

	return matches;
};

export { useMedia };
