import { novely, storageAdapterLocal, pauseOnBlur, EN, RU } from '@novely/core';
import { createRenderer } from '@novely/solid-renderer';
import { request } from './fetcher';

const { renderer } = createRenderer();

const engine = novely({
	askBeforeExit: false,
	defaultTypewriterSpeed: 'Fast',
	fetch: request,
	renderer,
	storage: storageAdapterLocal({ key: 'demo-game' }),
	translation: {
		en: {
			internal: EN,
		},
		ru: {
			internal: RU
		}
	},
	characters: {
		Alena: {
			name: {
				en: 'Alena',
				ru: 'Алёна'
			},
			color: '#ed5c87',
			emotions: {},
		},
		Me: {
			name: {
				en: 'Me',
				ru: 'Я'
			},
			color: '#000000',
			emotions: {},
		},
	},
	state: {
		name: {
			en: '',
			ru: ''
		},
		pressState: 'MISS' as ("PERFECT" | "PASS" | "MISS"),
		pressCount: 0
	},
});

pauseOnBlur(engine);

export { engine };
export const { script } = engine;
