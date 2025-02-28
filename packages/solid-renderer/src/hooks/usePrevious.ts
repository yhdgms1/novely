import type { Accessor } from 'solid-js';
import { createEffect, createSignal, untrack } from 'solid-js';

const createPrevious = <T>(get: Accessor<T>) => {
	const [previous, setPrevious] = createSignal(get());
	const [current, setCurrent] = createSignal(get());

	createEffect(() => {
		setPrevious(() => untrack(current));
		setCurrent(() => get());
	});

	return previous;
};

export { createPrevious };
