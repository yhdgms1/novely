import type { JSX, Accessor } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';

type AwaitProps<T> = {
	for: Promise<T>;
	children: (value: Accessor<NonNullable<T>>) => JSX.Element;
};

const Await = <T,>(props: AwaitProps<T>) => {
	const [value, setValue] = createSignal<T>();

	onMount(() => props.for.then(setValue));

	return <Show when={value()} children={props.children} />;
};

export { Await };
