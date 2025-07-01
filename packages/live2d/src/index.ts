import type { CustomHandler } from '@novely/core';
import type { TapHandlerFn, IdleHandlerFn, createModelView } from 'easy-cl2d';
import type { Thenable } from './types';
import { asset } from '@novely/core';
import { initialize, runtime, library, fetchLibrary } from './loading';
import { debounce } from 'es-toolkit';

const CUBISM_ID = Symbol();

type Data = {
	canvas: HTMLCanvasElement | undefined;
	view: ReturnType<typeof createModelView> | undefined;
};

const extractTextures = (model3: Record<string, unknown>) => {
	if ('FileReferences' in model3 && model3.FileReferences && typeof model3.FileReferences === 'object') {
		if ('Textures' in model3.FileReferences && Array.isArray(model3.FileReferences.Textures)) {
			return model3.FileReferences.Textures;
		}
	}

	return [];
};

type ModelOption = {
	directory: string;
	model3: string | Record<string, any>;
};

type ModelSettings = {
	onTap?: TapHandlerFn;
	onIdle?: IdleHandlerFn;
};

const addModel = (key: string, { directory, model3 }: ModelOption, { onTap, onIdle }: ModelSettings = {}) => {
	const handler: CustomHandler = async ({ request, clear, data, getDomNodes, ticker, flags: { preview } }) => {
		fetchLibrary();

		const _data = data<Data>();

		if (_data.canvas) {
			return;
		}

		const { element } = getDomNodes(true);

		element.style.cssText += `position: fixed; width: 100vw; height: 100vh; z-index: 3; overflow: hidden; overflow: clip; display: flex; align-items: flex-end; justify-content: center;`;

		const canvas = document.createElement('canvas');
		element.appendChild(canvas);

		canvas.style.cssText += `height: 100vh; width: 100vw;`;

		_data.canvas = canvas;

		await runtime;

		const { createModelView } = await library;

		const view = createModelView({
			fetch: request,
			model: {
				directory,
				model3,
			},
			ticker,
			canvas,
			onTap,
			onIdle,
		});

		const onResize = debounce(() => {
			view.resizeCanvas(element.clientWidth * devicePixelRatio, element.clientHeight * devicePixelRatio);
		}, 16);

		onResize();

		if (!preview) {
			addEventListener('resize', onResize, { passive: true });

			clear(() => {
				onResize.cancel();
				removeEventListener('resize', onResize);
			});
		}

		if (preview) {
			const unsubscribe = ticker.add((ticker) => {
				if (view.inner._state == 22) {
					unsubscribe();
					ticker.stop();
				}
			});
		}

		ticker.start();

		clear(() => {
			ticker.stop();
			view[Symbol.dispose]();

			canvas.remove();

			_data.canvas = undefined;
			_data.view = undefined;
		});

		_data.view = view;
	};

	handler.id = CUBISM_ID;
	handler.key = `cubism-${key}`;

	handler.assets = async ({ request }) => {
		if (typeof model3 === 'string') {
			try {
				const response = await request(directory + '/' + model3).then((res) => res.json());
				const textures = extractTextures(response);

				return textures.map((texture) => asset.image(directory + '/' + texture));
			} catch (e) {
				console.error(
					new Error('Failed to fetch "model3.json". Assets will not be preloaded for that model.', { cause: e }),
				);

				return [];
			}
		} else {
			const textures = extractTextures(model3);

			return textures.map((texture) => asset.image(directory + '/' + texture));
		}
	};

	handler.skipOnRestore = (next) => {
		return next.some(([action, fn]) => {
			if (action === 'custom' && fn.id === CUBISM_ID && fn.key === `cubism-${key}`) {
				return fn.name === 'add_model_handler' || fn.name === 'hide_model_handler';
			}

			return false;
		});
	};

	Object.defineProperty(handler, 'name', { value: 'add_model_handler' });

	return handler;
};

type UseModelCallbackParams = {
	model: NonNullable<Data['view']>['inner'] | undefined;
	flags: {
		restoring: boolean;
		goingBack: boolean;
		preview: boolean;
	};
};

type UseModelCleanupFn = () => void;

type UseModelCallback = (params: UseModelCallbackParams) => Thenable<UseModelCleanupFn | void>;

const useModel = (key: string, cb: UseModelCallback) => {
	const handler: CustomHandler = async ({ data, clear, flags }) => {
		fetchLibrary();

		await runtime;
		await library;

		const _data = data<Data>();

		const cleanup = await cb({
			model: _data.view?.inner,
			flags,
		});

		if (cleanup) {
			clear(cleanup);
		}
	};

	handler.id = CUBISM_ID;
	handler.key = `cubism-${key}`;

	handler.skipOnRestore = (next) => {
		return next.some(([action, fn]) => {
			if (action === 'custom' && fn.id === CUBISM_ID && fn.key === `cubism-${key}`) {
				return fn.name === 'use_model_handler' || fn.name === 'hide_model_handler';
			}

			return false;
		});
	};

	Object.defineProperty(handler, 'name', { value: 'use_model_handler' });

	return handler;
};

const hideModel = (key: string) => {
	const handler: CustomHandler = async ({ data }) => {
		fetchLibrary();

		const _data = data<Data>();

		const { view, canvas } = _data;

		if (view && canvas) {
			view[Symbol.dispose]();
			canvas.remove();

			_data.canvas = undefined;
			_data.view = undefined;
		}
	};

	handler.id = CUBISM_ID;
	handler.key = `cubism-${key}`;

	handler.skipOnRestore = (next) => {
		return next.some(([action, fn]) => {
			if (action === 'custom' && fn.id === CUBISM_ID && fn.key === `cubism-${key}`) {
				return fn.name === 'add_model_handler';
			}

			return false;
		});
	};

	Object.defineProperty(handler, 'name', { value: 'hide_model_handler' });

	return handler;
};

const cubism = {
	add: addModel,
	use: useModel,
	hide: hideModel,
};

export { initialize, cubism };
export type { UseModelCallbackParams };
