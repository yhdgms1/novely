type InitializeOptions = {
	/**
	 * URL to Cubism 4 runtime
	 */
	runtimeURL: string;
	/**
	 * You can manage when Cubism runtime will be loaded
	 * @param fetch Function that will load Cubism runtime
	 * @example
	 * ```ts
	 * initialize({
	 *   runtimeURL: './live2dcubismcore.js',
	 *   runtimeFetch: (fetch) => {
	 *     requestIdleCallback(fetch, { timeout: 1000 })
	 *   }
	 * })
	 * ```
	 */
	runtimeFetch?: (fetch: () => void) => void;
	/**
	 * @param fetch Function that will load Pixi.js and pixi-live2d-display
	 */
	libraryFetch?: (fetch: () => void) => void;
};

type Shared = {
	runtimeURL: string;
};

const shared: Shared = {
	runtimeURL: '',
};

const {
	promise: library,
	resolve: libResolve,
	reject: libReject,
} = Promise.withResolvers<typeof import('./cubism-module')>();
const { promise: runtime, resolve: runtimeResolve } = Promise.withResolvers<void>();

const noop = () => {};

const once = (fn: () => void) => {
	let called = false;

	return () => {
		if (!called) {
			called = true;
			fn();
		}
	};
};

const log = (msg: string) => {
	const time = (performance.now() / 1000).toFixed(2);

	console.log(`%c[${time}s] ${msg}`, 'background: #f34361; color: #fff; padding: 4px 8px;');
};

const fetchRuntime = once(() => {
	const script = document.createElement('script');

	script.src = shared.runtimeURL;
	script.async = true;

	script.addEventListener('load', () => {
		runtimeResolve();
		log('Cubism Runtime Load');
	});

	script.addEventListener('error', () => {
		runtimeResolve();
	});

	document.body.appendChild(script);
});

const fetchLibrary = once(async () => {
	fetchRuntime();

	try {
		libResolve(await import('./cubism-module'));
		log('Library Load');
	} catch {
		libReject();
	}
});

const initialize = ({ runtimeURL, runtimeFetch = noop, libraryFetch = noop }: InitializeOptions) => {
	shared.runtimeURL = runtimeURL;

	runtimeFetch(fetchRuntime);
	libraryFetch(fetchLibrary);
};

export { initialize, fetchLibrary, runtime, library };
