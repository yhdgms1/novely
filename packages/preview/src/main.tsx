import 'animate.css';
import 'normalize.css'

import { render } from 'solid-js/web'
import { novely, localStorageStorage } from '@novely/core'
import { createT9N, RU, EN } from '@novely/t9n'
import { createSolidRenderer } from '@novely/solid-renderer'

import '@novely/solid-renderer/dist/styles/index.css'

// import { video } from '@novely/video'
import { particles } from '@novely/particles'
import { snow, fireflies } from './particles'

const { createRenderer, Novely } = createSolidRenderer();

const engine = novely({
  languages: ['ru', 'en'],
  storage: localStorageStorage({ key: 'novely-saves' }),
  renderer: createRenderer,
  characters: {
    'Sayori': {
      name: {
        ru: 'Саёри',
        en: 'Sayori',
      },
      color: '#ce606a',
      emotions: {
        ok: {
          body: {
            left: 'https://i.imgur.com/cCKs0wZ.png',
            right: 'https://i.imgur.com/Bl1rDMd.png'
          },
          head: 'https://i.imgur.com/fvXCgNx.png'
        },
      },
    },
    'Natsuki': {
      name: {
        ru: 'Нацуки',
        en: 'Natsuki'
      },
      color: '#f58eb1',
      emotions: {
        ok: {
          body: {
            left: 'https://i.imgur.com/d54g3M3.png',
            right: 'https://i.imgur.com/Z5ZOl7j.png'
          },
          head: 'https://i.imgur.com/fFDRWdU.png'
        },
        sad: {
          body: {
            left: 'https://i.imgur.com/d54g3M3.png',
            right: 'https://i.imgur.com/Z5ZOl7j.png'
          },
          head: 'https://i.imgur.com/jb5Yejg.png'
        }
      }
    }
  },
  t9n: createT9N({
    ru: {
      internal: RU,
      pluralization: {
        'years': {
          zero: 'лет',
          one: 'год',
          few: 'года',
          many: 'лет'
        }
      },
      strings: {
        'HowOldAreYou': 'Привет, {{name}}! Сколько тебе лет? 😙',
        'ReallyAgeYears': 'Правда {{age}} {{age@years}}? Загляни ко мне как-нибудь',
        'YouAreAgeYears': 'Тебе {{age}} {{age@years}}? Старик',
      }
    },
    en: {
      internal: EN,
      pluralization: {
        'years': {
          zero: 'years',
          one: 'year',
          few: 'years',
          many: 'years',
          other: 'years'
        }
      },
      strings: {
        'HowOldAreYou': 'Hi, {{name}}! How old are you? 😙',
        'ReallyAgeYears': 'Really {{age}} {{age@years}}? Drop by and see me sometime',
        'YouAreAgeYears': "You are {{age}} {{age@years}} old? Старик",
      }
    },
  }),

  state: {
    name: '',
    age: 0,
  },

  autosaves: true,

  initialScreen: 'mainmenu'
});

const { action, state, t } = engine;

/**
 * todo: проверить будет ли работать анимация как тут
 * @see https://youtu.be/8c34MKT2n6I?list=PLejGw9J2xE9WFYI08jbVMgI2moQdN3a2X&t=1809
 */

engine.withStory({
  'start': [
    // todo: `Music` должно играть после конца
    action.showBackground('https://i.imgur.com/96NUxvz.png'),
    action.custom(particles(fireflies)),
    action.showCharacter('Sayori', 'ok', 'animate__animated animate__fadeInUp', 'left: 15%'),
    action.animateCharacter('Sayori', 500, 'awd'),
    action.dialog('Sayori', 'Привет! Ты <em>новенький</em>, не так ли?'),
    // action.custom(video({ url: 'http://techslides.com/demos/sample-videos/small.mp4', controls: true, })),
    action.choice(
      'Ты новенький?',
      [
        'Да, я новенький!',
        [
          action.custom(particles(snow)),
          action.dialog('Sayori', 'Не хочешь зайти ко мне в гости сегодня?'),
          action.choice(
            [
              'Не откажусь!',
              [action.jump('act-1')]
            ]
          )
        ]
      ]
    )
  ],
  'act-1': [
    action.showBackground('https://i.imgur.com/L50iCQZ.png'),
    action.showCharacter('Sayori', 'ok', '', 'left: 15%'),
    action.dialog('Sayori', 'Добро пожаловать'),
    action.showCharacter('Natsuki', 'ok', 'animate__animated animate__fadeInUp', 'right: 15%'),
    action.dialog('Natsuki', 'Кого ты привела?!'),
    action.dialog('Sayori', 'Знакомься, это'),
    action.input(
      'Введите ваше имя',
      ({ input, error }) => {
        error(input.validationMessage);
        state({ name: input.value });
      },
      (input) => {
        input.setAttribute('minlength', '2');
        input.setAttribute('maxlength', '16');
      }
    ),
    action.dialog('Natsuki', t('HowOldAreYou')),
    action.input(
      'Введите ваш возраст',
      ({ input, error }) => {
        error(input.validationMessage);
        state({ age: input.valueAsNumber })
      },
      (input) => {
        input.setAttribute('type', 'number');
        input.setAttribute('min', '14');
        input.setAttribute('max', '88');
      }
    ),
    action.condition(
      () => state().age <= 16 ? 'ok' : 'no',
      {
        'ok': [
          action.hideCharacter('Sayori'),
          action.dialog('Natsuki', t('ReallyAgeYears')),
          action.exit(),
        ],
        'no': [
          action.dialog('Natsuki', t('YouAreAgeYears'), 'sad'),
          action.exit()
        ]
      }
    ),
    action.dialog('Natsuki', 'Сейчас будет выход'),
    action.end()
  ]
});

render(() => (
  <Novely
    style={{
      '--novely-settings-background-image': `url(https://i.imgur.com/pYRK2zS.png)`,
      '--novely-main-menu-background-image': `url(https://i.imgur.com/pYRK2zS.png)`,
      '--novely-saves-background-image': `url(https://i.imgur.com/pYRK2zS.png)`,
    }}
  />
), document.body);

export { }
