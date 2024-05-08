import type { BaseTranslationStrings } from '@novely/core';

import * as Novely from '@novely/core';
import { novely as createNovely, localStorageStorage, EN, RU, KK, JP } from '@novely/core';
import { createSolidRenderer } from '@novely/solid-renderer';
import { style } from './styles';

style();

type NoUndefined<T> = T extends undefined ? never : T;
type CreateSolidRendererOptions = NoUndefined<Parameters<typeof createSolidRenderer>[0]>;
type SolidRenderer = ReturnType<typeof createSolidRenderer>;

type OriginalNovelyParameters = Parameters<typeof createNovely>[0];
type NovelyParameters = Omit<OriginalNovelyParameters, 'translation' | 'renderer'>;

declare global {
	interface Window {
		Novely: typeof import('@novely/core');

		rendererOptions: CreateSolidRendererOptions;
		storageKey: string;

		RU: Record<BaseTranslationStrings, string>;
		EN: Record<BaseTranslationStrings, string>;
		KK: Record<BaseTranslationStrings, string>;
		JP: Record<BaseTranslationStrings, string>;

		options: NovelyParameters;

		solidRenderer: SolidRenderer;
		engine: ReturnType<typeof createNovely>;
	}
}

Object.defineProperty(window, 'Novely', {
	value: Novely,
	writable: false
});

window.RU = RU;
window.EN = EN;
window.KK = KK;
window.JP = JP;

let rendererOptions: CreateSolidRendererOptions | undefined;
let storageKey = 'novely-saves';

Object.defineProperty(window, 'rendererOptions', {
	get() {
		return rendererOptions;
	},
	set(value: CreateSolidRendererOptions) {
		window.solidRenderer = createSolidRenderer((rendererOptions = value));
	},
});

Object.defineProperty(window, 'storageKey', {
	get() {
		return storageKey;
	},
	set(value: string) {
		storageKey = value;
	},
});

let translation: OriginalNovelyParameters['translation'] | undefined;

Object.defineProperty(window, 'translation', {
	get() {
		return translation;
	},
	set(value) {
		translation = value;
	},
});

let options: NovelyParameters | undefined;

Object.defineProperty(window, 'options', {
	get() {
		return options;
	},
	set(value: NovelyParameters) {
		options = value;

		const ru = navigator.language.toLowerCase().includes('ru');

		if (!translation) {
			const message = ru
				? `'translation' не определен. Скорее всего, вы удалили установку перевода. Верните её обратно.`
				: `'translation' is not defined. Most likely you have deleted the translation installation. Put it back.`;

			throw new Error(message);
		}

		if (!window.solidRenderer) {
			const message = ru
				? `'solidRenderer' не определен. Скорее всего, вы удалили присвоение 'rendererOptions'. Верните его обратно.`
				: `'solidRenderer' is not defined. Most likely, you have deleted the 'rendererOptions' assignment. Put it back.`;

			throw new Error(message);
		}

		options.storage ||= localStorageStorage({ key: storageKey });

		window.engine = createNovely({
			...options,
			translation,
			renderer: window.solidRenderer.renderer,
		});
	},
});
