import { novely, localStorageStorage } from '@novely/core';
import { createT9N, EN } from '@novely/t9n';
import { createSolidRenderer } from '@novely/solid-renderer';

const solidRenderer = createSolidRenderer();

const translation = createT9N({
  en: {
    internal: EN,
    pluralization: {},
    strings: {}
  }
});

const engine = novely({
  languages: ['en'],
  renderer: solidRenderer.createRenderer,
  storage: localStorageStorage({ key: 'my-game' }),
  t9n: translation,
  characters: {
    Natsuki: {
      name: {
        en: 'Natsuki'
      },
      color: '#c44475',
      emotions: {
        crying: {
          head: 'https://i.imgur.com/jb5Yejg.png',
          body: {
            right: 'https://i.imgur.com/Z5ZOl7j.png',
            left: 'https://i.imgur.com/d54g3M3.png'
          }
        },
        astonished: {
          head: 'https://i.imgur.com/fFDRWdU.png',
          body: {
            right: 'https://i.imgur.com/Z5ZOl7j.png',
            left: 'https://i.imgur.com/d54g3M3.png'
          }
        },
        happy: {
          head: 'https://i.imgur.com/qqLtENM.png',
          body: {
            right: 'https://i.imgur.com/Z5ZOl7j.png',
            left: 'https://i.imgur.com/d54g3M3.png'
          }
        }
      }
    }
  },
});

export { engine, solidRenderer };