import { EN, storageAdapterLocal, novely } from '@novely/core';
import { createRenderer } from '@novely/solid-renderer';

import lily from './assets/lily.png';

const { renderer } = createRenderer();

const engine = novely({
	renderer,
	storage: storageAdapterLocal({ key: 'my-game' }),
	translation: {
		en: {
			internal: EN,
		},
	},
	characters: {
		Lily: {
			name: {
				en: 'Lily',
			},
			color: '#ed5c87',
			emotions: {
				normal: lily,
			},
		},
		You: {
			name: {
				en: 'You',
			},
			color: '#000000',
			emotions: {},
		},
	},
});

export { engine };
