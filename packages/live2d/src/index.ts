import type { CustomHandler } from '@novely/core';
import type { Application } from '@pixi/app';
import type { InternalModel, Live2DModel, CubismSpec } from 'pixi-live2d-display';
import { initialize, runtime, library, fetchLibrary } from './loading';

const LIVE2D_ID = Symbol();

type Data = {
	async:
		| undefined
		| Promise<{
				app: Application;
				map: Map<string, Live2DModel<InternalModel>>;
		  }>;
};

const addCubismModel = (key: string, from: string | (CubismSpec.ModelJSON & { url: string })) => {
	const handler: CustomHandler = async ({ clear, data, getDomNodes, flags: { goingBack, preview } }) => {
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

		const { Live2DModel, Cubism4ModelSettings } = await library;
		const { app, map } = await data<Data>().async!;

		if (preview) {
			// todo: render static
		}

		clear(() => {
			// is this good?
			// app.destroy()
		});

		const model = await Live2DModel.from(typeof from === 'string' ? from : new Cubism4ModelSettings(from));

		map.set(key, model);

		// todo: it should be adjustable
		model.scale.set(0.25, 0.25);
		app.stage.addChild(model);
	};

	handler.callOnlyLatest = handler.skipClearOnGoingBack = true;
	handler.id = LIVE2D_ID;
	handler.key = 'live2d_add_model';

	return handler;
};

// todo: add functions to hide model, and to trigger model animations

export { initialize, addCubismModel };
