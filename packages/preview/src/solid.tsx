import 'animate.css';
import 'normalize.css'

import { render } from 'solid-js/web'
import { novely, localStorageStorage } from '@novely/core'
import { createT9N, RU, EN } from '@novely/t9n'
import { createSolidRenderer } from '@novely/solid-renderer'

import '@novely/solid-renderer/dist/index.css'

// import chingchenghanji from './assets/ChingChengHanji.mp3';
import classRoom from './assets/class.webp';
import bedroomRoom from './assets/bedroom.webp';
import masakiNatsukoOk from './assets/Masaki Natsuko.webp';
import outsideSchool from './assets/outside.webp';

// import { video } from '@novely/video'
// import { particles } from '@novely/particles'
// import { snow, fireflies } from './particles'

const { createRenderer, Novely } = createSolidRenderer();

const engine = await novely({
  languages: ['ru', 'en'],
  storage: localStorageStorage({ key: 'novely-saves' }),
  renderer: createRenderer,
  characters: {
    'Masaki Natsuko': {
      name: {
        ru: 'Масаки Натсуко',
        en: 'Masaki Natsuko',
      },
      color: '#e29f01',
      emotions: {
        ok: masakiNatsukoOk,
      },
    },
    'Nezuko': {
      name: 'Нацуки',
      color: '#f67288',
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
        'ReallyAgeYears': 'Правда {{age}} {{age@years}}? Загляни ко мне как-нибудь 😉',
        'YouAreAgeYears': 'Тебе {{age}} {{age@years}}?? Не умею я определять возраст... 😅',
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
        'ReallyAgeYears': 'Really {{age}} {{age@years}}? Drop by and see me sometime 😉',
        'YouAreAgeYears': "You are {{age}} {{age@years}} old? I'm not good at determining age... 😅",
      }
    },
  }),

  assetsPreload: false
});

const { action, state, t } = engine;

/**
 * todo: проверить будет ли работать анимация как тут
 * @see https://youtu.be/8c34MKT2n6I?list=PLejGw9J2xE9WFYI08jbVMgI2moQdN3a2X&t=1809
 */

engine.withStory({
  'start': [
    // todo: `Music` должно играть после конца
    action.showBackground(classRoom),
    // action.custom(particles(fireflies)),
    action.showCharacter('Masaki Natsuko', 'ok', 'animate__animated animate__fadeInUp', 'left: 15%'),
    action.animateCharacter('Masaki Natsuko', 5000, 'ebebebe'),
    action.dialog('Masaki Natsuko', 'Привет! Ты <em>новенький</em>, не так ли?'),
    // action.vibrate(100, 30, 100, 30, 100, 200, 200, 30, 200, 30, 200, 200, 100, 30, 100, 30, 100),
    // action.custom(video({ url: 'http://techslides.com/demos/sample-videos/small.mp4', controls: true, })),
    action.choice(
      [
        'Да, я новенький!',
        [
          // action.custom(particles(snow)),
          action.dialog('Masaki Natsuko', 'Не хочешь зайти ко мне в гости сегодня? 😜'),
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
    action.showBackground(bedroomRoom),
    action.showCharacter('Masaki Natsuko', 'ok', '', 'left: 15%'),
    action.dialog('Masaki Natsuko', 'Добро пожаловать'),
    action.showCharacter('Nezuko', 'ok', 'animate__animated animate__fadeInUp', 'right: 15%'),
    action.dialog('Nezuko', 'Сестрёнка, кого ты привела?!'),
    action.dialog('Masaki Natsuko', 'Знакомься, это'),
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
    action.dialog('Nezuko', t('HowOldAreYou')),
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
      () => state().age! <= 16 ? 'ok' : 'no',
      {
        'ok': [
          action.hideCharacter('Masaki Natsuko'),
          action.dialog('Nezuko', t('ReallyAgeYears')),
          action.end()
        ],
        'no': [
          action.dialog('Nezuko', t('YouAreAgeYears'), 'sad'),
          action.end()
        ]
      }
    )
  ]
});

render(() => (
  <Novely
    style={{
      '--novely-settings-background-image': `url(${outsideSchool})`,
      '--novely-main-menu-background-image': `url(${outsideSchool})`,
      '--novely-saves-background-image': `url(${outsideSchool})`,
    }}
  />
), document.body);

export { }
