type ControlledPromise<T> = Promise<
	| {
			value: T;
			cancelled: false;
	  }
	| {
			value: null;
			cancelled: true;
	  }
>;

type ControlledPromiseObj<T> = {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;

	promise: ControlledPromise<T>;

	cancel: () => void;
};

const createControlledPromise = <T = void>() => {
	const object = {
		resolve: null,
		reject: null,

		promise: null,

		cancel: null,
	} as unknown as ControlledPromiseObj<T>;

	const init = () => {
		const promise = new Promise((resolve, reject) => {
			object.reject = reject;
			object.resolve = (value) => {
				resolve({ cancelled: false, value });
			};

			object.cancel = () => {
				resolve({ cancelled: true, value: null });
				init();
			};
		});

		object.promise = promise as ControlledPromise<T>;
	};

	return init(), object;
};

export { createControlledPromise };
export type { ControlledPromise, ControlledPromiseObj };
