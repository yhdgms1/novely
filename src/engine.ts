import { novely, storageAdapterLocal, pauseOnBlur, EN, RU } from '@novely/core';
import { createRenderer } from '@novely/solid-renderer';
import { darya } from './assets'

const { renderer } = createRenderer();

const engine = novely({
	askBeforeExit: false,
	defaultTypewriterSpeed: 'Fast',
	renderer,
	storage: storageAdapterLocal({ key: 'demo' }),
	translation: {
		en: {
			internal: EN,
		},
		ru: {
			internal: RU
		}
	},
	characters: {
		Darya: {
			name: {
				en: 'Darya',
				ru: 'Дарья'
			},
			color: '#ed5c87',
			emotions: {
				default: darya,
			},
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
	defaultEmotions: {
		Darya: 'default'
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
