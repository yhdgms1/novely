import { EN, RU, novely } from '@novely/core';
import { createSolidRenderer } from '@novely/solid-renderer';
import { games } from './utilities';

import lily from './assets/lily.png';

const { renderer } = createSolidRenderer({
	/**
	 * Чтобы избежать отклонения по пункту 1.10.3 требований платформы переносим элементы управления внутрь диалогового окна
	 */
	controls: 'inside',
});

const engine = novely({
	renderer,
	storage: games,
	translation: {
		en: {
			internal: EN,
		},
		// Для поддержки русского языка раскомментировать
		// ru: {
		// 	internal: RU
		// }
	},
	storageDelay: games.loaded,
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

	overrideLanguage: true,
	getLanguage(languages, original) {
		if ('sdk' in games) {
			const {
				environment: {
					i18n: { lang },
				},
			} = games.sdk;

			if (languages.includes(lang)) {
				return (document.documentElement.lang = lang);
			}

			//! Замените `languages[0]` на язык по-умолчанию. Например, русский для Казахстана
			return (document.documentElement.lang = languages[0]);
		}

		return (document.documentElement.lang = original(languages));
	},
	autosaves: false,
	askBeforeExit: false,
});

export { engine };
