import { dequal } from 'dequal';
import type { Atom, ReadableAtom } from 'nanostores';
import { atom, onMount } from 'nanostores';

const memo = <T, K>(input: Atom<T>, cb: (value: T) => K) => {
	const $memoized = atom<K>(cb(input.get()));

	const unsubscribe = input.subscribe((value) => {
		const comparable = cb(value);

		if (!dequal($memoized.get(), comparable)) {
			// @ts-ignore
			$memoized.set(
				typeof comparable === 'object'
					? { ...comparable }
					: Array.isArray(comparable)
						? [...comparable]
						: comparable,
			);
		}
	});

	onMount($memoized, () => {
		return unsubscribe;
	});

	return $memoized as ReadableAtom<K>;
};

export { memo };
