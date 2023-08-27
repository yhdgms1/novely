import { novely, localStorageStorage } from '@novely/core'
import { createT9N, EN } from '@novely/t9n'
import { createSolidRenderer } from '@novely/solid-renderer'

import lily from './assets/lily.png'

const { createRenderer } = createSolidRenderer()

const translation = createT9N({
	en: {
		internal: EN,
		pluralization: {},
		strings: {},
	},
})

const engine = novely({
	languages: ['en'],
	renderer: createRenderer,
	storage: localStorageStorage({ key: 'my-game' }),
	t9n: translation,
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
