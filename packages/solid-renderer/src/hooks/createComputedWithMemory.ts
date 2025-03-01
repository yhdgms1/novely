import type { AccessorArray } from 'solid-js';
import { on, createEffect, createSignal, untrack } from 'solid-js';

const createComputedWithMemory = <T, K>(
	input: AccessorArray<T>,
	cb: (current: NoInfer<T>, previous: NoInfer<T> | undefined) => K,
) => {
	const initial = input.map((accessor) => untrack(accessor)) as T;
	const [computed, setComputed] = createSignal<K>(cb(initial, undefined));

	createEffect(
		on(input, (input, prev) => {
			setComputed(() => cb(input, prev));
		}),
	);

	return computed;
};

export { createComputedWithMemory };
