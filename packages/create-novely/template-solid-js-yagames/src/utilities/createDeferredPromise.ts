const createDeferredPromise = <T = void>() => {
	let resolve!: (value: T) => void, reject!: (value: T) => void;

	const promise = new Promise<T>((_resolve, _reject) => {
		(resolve = _resolve), (reject = _reject);
	});

	return { promise, resolve, reject };
};

export { createDeferredPromise };
