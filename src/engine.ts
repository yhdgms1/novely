import { novely, localStorageStorage, pauseOnBlur, EN, RU } from '@novely/core';
import { createSolidRenderer } from '@novely/solid-renderer';
import { darya } from './assets'

const { renderer } = createSolidRenderer();

const engine = novely({
	askBeforeExit: false,
	defaultTypewriterSpeed: 'Fast',
	renderer,
	storage: localStorageStorage({ key: 'my-game' }),
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
		}
	},
});

pauseOnBlur(engine);

export { engine };
export const { script } = engine;
