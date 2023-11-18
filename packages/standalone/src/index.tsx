import type { BaseTranslationStrings } from '@novely/core'

import { novely as createNovely, localStorageStorage, EN, RU, KK, JP } from '@novely/core'
import { createSolidRenderer } from '@novely/solid-renderer'
import { style } from './styles'

style();

type NoUndefined<T> = T extends undefined ? never : T;
type CreateSolidRendererOptions = NoUndefined<Parameters<typeof createSolidRenderer>[0]>;
type SolidRenderer = ReturnType<typeof createSolidRenderer>;

type NovelyParameters = Omit<Parameters<typeof createNovely>[0], 't9n' | 'renderer'>

declare global {
  interface Window {
    rendererOptions: CreateSolidRendererOptions;

    RU: Record<BaseTranslationStrings, string>;
    EN: Record<BaseTranslationStrings, string>;
    KK: Record<BaseTranslationStrings, string>;
    JP: Record<BaseTranslationStrings, string>;

    options: NovelyParameters

    solidRenderer: SolidRenderer;
    novely: ReturnType<typeof createNovely>;
  }
}

window.RU = RU;
window.EN = EN;
window.KK = KK;
window.JP = JP;

let rendererOptions: CreateSolidRendererOptions | undefined;

Object.defineProperty(window, 'rendererOptions', {
  get() {
    return rendererOptions;
  },
  set(value: CreateSolidRendererOptions) {
    window.solidRenderer = createSolidRenderer(rendererOptions = value);
  }
});

let translation: NovelyParameters['translation'] | undefined;

Object.defineProperty(window, 'translation', {
  get() {
    return translation;
  },
  set(value) {
    translation = value;
  }
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
        ? `'solidRenderer' не определен. Скорее всего, вы удалили присвоение 'rendererOption'. Верните его обратно.`
        : `'solidRenderer' is not defined. Most likely, you have deleted the 'rendererOption' assignment. Put it back.`;

      throw new Error(message);
    }

    options.storage ||= localStorageStorage({ key: 'novely-saves' });

    window.novely = createNovely({
      ...options,
      translation,
      renderer: window.solidRenderer.createRenderer
    });
  }
});
