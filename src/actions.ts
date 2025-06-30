import type { TypesFromEngine, TextContent, ValidAction } from '@novely/core';
import type { ParticleOptions } from './particles';
import type { CreateMomentPresserOptions } from '@novely/moment-presser';
import { extendAction } from '@novely/core';
import { showParticles } from '@novely/particles';
import { createMomentPresser } from '@novely/moment-presser';
import { initialize, cubism } from '@novely/live2d';
import { engine } from './engine';

initialize({
	runtimeURL: 'live2dcubismcore.js',
	runtimeFetch: (fetch) => {
		if (typeof requestIdleCallback !== 'undefined') {
			requestIdleCallback(fetch, { timeout: 1000 })
		} else {
			setTimeout(fetch, 1000);
		}
	},
	libraryFetch: (fetch) => {
		if (typeof requestIdleCallback !== 'undefined') {
			requestIdleCallback(fetch, { timeout: 1500 })
		} else {
			setTimeout(fetch, 1500);
		}
	}
});

type Types = TypesFromEngine<typeof engine>;

type Characters = keyof Types['c'];
type Text = TextContent<Types['l'], Types['s']>;

const talk = (character: Characters, text: Text) => {
	return [
		// todo: animate character model
		engine.action.say(character, text),
	] as ValidAction;
}

const action = extendAction(engine.action, {
	talk,
	showParticles: (options: ParticleOptions) => {
		return ['custom', showParticles(options)];
	},
	momentPresser: (onPressed: CreateMomentPresserOptions<Types>['onPressed']) => {
		const momentPresser = createMomentPresser<Types>({
			onPressed: onPressed,
			translation: {
				en: {
					stop: 'Stop'
				},
				ru: {
					stop: 'Стоп'
				}
			}
		});

		return ['custom', momentPresser];
	},
	addModel: (key: string, options: Parameters<typeof cubism.add>[1], settings?: Parameters<typeof cubism.add>[2]) => {
		return ['custom', cubism.add(key, options, settings)]
	},
	useModel: (key: string, cb: Parameters<typeof cubism.use>[1]) => {
		return ['custom', cubism.use(key, cb)]
	}
});

export { action }
