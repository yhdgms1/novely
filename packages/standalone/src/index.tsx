import type { BaseTranslationStrings, T9N, SetupT9N } from '@novely/t9n'

import { render } from 'solid-js/web';
import { novely as createNovely, localStorageStorage } from '@novely/core'
import { createT9N, EN, RU, KK, JP } from '@novely/t9n'
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
    translation: Parameters<SetupT9N<string>>[0];

    RU: Record<BaseTranslationStrings, string>;
    EN: Record<BaseTranslationStrings, string>;
    KK: Record<BaseTranslationStrings, string>;
    JP: Record<BaseTranslationStrings, string>;

    options: NovelyParameters

    solidRenderer: SolidRenderer;
    novely: ReturnType<typeof createNovely>;

    target: HTMLElement;
  }
}

window.RU = RU;
window.EN = EN;
window.KK = KK;
window.JP = JP;

window.target ||= document.body;

let rendererOptions: CreateSolidRendererOptions | undefined;

Object.defineProperty(window, 'rendererOptions', {
  get() {
    return rendererOptions;
  },
  set(value: CreateSolidRendererOptions) {
    window.solidRenderer = createSolidRenderer(rendererOptions = value);
  }
});

let translation: T9N<string, string> | undefined;

Object.defineProperty(window, 'translation', {
  get() {
    return translation;
  },
  set(value) {
    translation = createT9N(value);
  }
});

let options: NovelyParameters | undefined;
let dispose: (() => void) | undefined;

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
      t9n: translation,
      renderer: window.solidRenderer.createRenderer
    });

    const original = window.novely.withStory;

    window.novely.withStory = (story) => {
      const promise = original(story);

      promise.then(() => {
        if (!window.solidRenderer) {
          const message = ru
            ? `'solidRenderer' не определен. Невозможно запустить игру.`
            : `'solidRenderer' is not defined. Unable to start the game.`;

          throw new Error(message);
        }

        if (dispose) dispose();

        const { Novely } = window.solidRenderer;

        dispose = render(() => <Novely />, window.target);
      });

      return promise;
    }
  }
});
