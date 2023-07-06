import { novely, localStorageStorage } from '@novely/core';
import { createT9N, EN } from '@novely/t9n';
import { createSolidRenderer } from '@novely/solid-renderer';
import { initialized } from './global';

import lily from './assets/lily.png';

const { createRenderer, Novely } = createSolidRenderer();

const translation = createT9N({
  en: {
    internal: EN,
    pluralization: {},
    strings: {}
  }
});

const engine = novely({
  languages: ['en'],
  renderer: createRenderer,
  storage: localStorageStorage({ key: 'my-game' }),
  t9n: translation,
  storageDelay: initialized.promise,
  characters: {
    Lily: {
      name: {
        en: 'Lily'
      },
      color: '#ed5c87',
      emotions: {
        normal: lily
      }
    },
    You: {
      name: {
        en: 'You'
      },
      color: '#000000',
      emotions: {}
    }
  },
});

export { engine, Novely };
