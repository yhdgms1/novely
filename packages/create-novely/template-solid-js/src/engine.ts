import { novely, localStorageStorage, EN } from '@novely/core'
import { createSolidRenderer } from '@novely/solid-renderer'

import lily from './assets/lily.png'

const { renderer } = createSolidRenderer()

const engine = novely({
	renderer,
	storage: localStorageStorage({ key: 'my-game' }),
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
})

export { engine }
