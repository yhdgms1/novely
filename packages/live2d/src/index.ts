import type { CustomHandler } from '@novely/core';
import type { getModel as GetModelFn, Application } from './pixi-live2d';
import type { InternalModel, Live2DModel } from 'pixi-live2d-display';
import { initialize, runtime, library, fetchLibrary } from './loading';

const LIVE2D_ID = Symbol();

type GetModelFromCallback = (from: typeof GetModelFn) => ReturnType<typeof GetModelFn>;

type Data = {
	async:
		| undefined
		| Promise<{
				app: Application;
				map: Map<string, Live2DModel<InternalModel>>;
		  }>;
};

const addModel = (key: string, get: GetModelFromCallback) => {
	const handler: CustomHandler = async ({ clear, data, getDomNodes, paused, flags: { goingBack, preview } }) => {
		fetchLibrary();

		const { element } = getDomNodes(true);

		element.style.cssText += `position: absolute;inset: 0;z-index: 3;`;

		if (data<Data>().async === undefined) {
			const { promise, resolve } = Promise.withResolvers<Awaited<NonNullable<Data['async']>>>();

			data<Data>().async = promise;

			library.then(({ Application }) => {
				const canvas = document.createElement('canvas');
				element.appendChild(canvas);

				const app = new Application({
					view: canvas,
					resizeTo: element,
					backgroundAlpha: 0,
				});

				resolve({
					app,
					map: new Map(),
				});
			});
		}

		await runtime;

		const { getModel } = await library;
		const { app, map } = await data<Data>().async!;

		clear(() => {
			// is this good?
			// app.destroy()
		});

		const model = await get(getModel);

		map.set(key, model);

		model.scale.set(0.25, 0.25);
		app.stage.addChild(model);
	};

	handler.callOnlyLatest = handler.skipClearOnGoingBack = true;
	handler.id = LIVE2D_ID;
	handler.key = 'live2d_add_model';

	return handler;
};

export { initialize, addModel };
