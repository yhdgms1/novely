type Stored<T> = {
	subscribe: (cb: (value: T) => void) => () => void;
	update: (fn: (prev: T) => T) => void;
	get: () => T;
};

const store = <T>(current: T, subscribers = new Set<(value: T) => void>()): Stored<T> => {
	const subscribe = (cb: (value: T) => void) => {
		subscribers.add(cb), cb(current);

		return () => {
			subscribers.delete(cb);
		};
	};

	const push = (value: T) => {
		for (const cb of subscribers) cb(value);
	};

	const update = (fn: (prev: T) => T) => {
		push((current = fn(current)));
	};

	const get = () => {
		return current;
	};

	return { subscribe, update, get } as const;
};

export { store };
export type { Stored };
