import 'animate.css';
import 'normalize.css'

import { render } from 'solid-js/web'
import { novely, defineCharacter, localStorageStorage } from '@novely/core'
import { createSolidRenderer } from '@novely/solid-renderer'

import '@novely/solid-renderer/dist/index.css'

// import chingchenghanji from './assets/ChingChengHanji.mp3';
import classRoom from './assets/class.webp';
import bedroomRoom from './assets/bedroom.webp';
import masakiNatsukoOk from './assets/Masaki Natsuko.webp';

const masaki = defineCharacter({
  name: 'Масаки Натсуко',
  color: '#e29f01',
  emotions: {
    ok: masakiNatsukoOk,
  },
} as const);

const nezuko = defineCharacter({
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
} as const)

const { createRenderer, Novely } = createSolidRenderer();

const engine = novely({
  storage: localStorageStorage({ key: 'novely-' }),
  renderer: createRenderer,
  characters: {
    'Masaki Natsuko': masaki,
    'Nezuko': nezuko
  },
  i18n: (i18n, self) => {
    return i18n.extend(
      {
        ru: {
          'лет': {
            zero: 'лет',
            one: 'год',
            few: 'года',
            many: 'лет'
          }
        },
        en: {
          'лет': {
            zero: 'years',
            one: 'years',
            few: 'years',
            many: 'years'
          }
        },
      },
      {
        ru: {
          'Привет! Ты <em>новенький</em>, не так ли?': self,
          'Да, я новенький!': self,
          'Не хочешь зайти ко мне в гости сегодня? 😜': self,
          'Не откажусь!': self,
          'Правда {{age}} лет? Загляни ко мне как-нибудь 😉': ({ age, pluralize }) => {
            return `Правда ${age} ${pluralize('лет', age)}? Загляни ко мне как-нибудь 😉`;
          },
          'Тебе {{age}} лет?? Не умею я определять возраст... 😅': ({ age, pluralize }) => {
            return `Тебе ${age} ${pluralize('лет', age)}?? Не умею я определять возраст... 😅`;
          }
        },
        en: {
          'Привет! Ты <em>новенький</em>, не так ли?': "Hi! You're <em>new</em>, aren't you?",
          'Да, я новенький!': "Yes, I am new!",
          'Не хочешь зайти ко мне в гости сегодня? 😜': 'Would you like to come and visit me today? 😜',
          'Не откажусь!': "I won't say no!",
          'Правда {{age}} лет? Загляни ко мне как-нибудь 😉': ({ age, pluralize }) => {
            return `Really ${age} ${pluralize('лет', age)}? Drop by and see me sometime 😉`;
          },
          'Тебе {{age}} лет?? Не умею я определять возраст... 😅': ({ age, pluralize }) => {
            return `You are ${age} ${pluralize('лет', age)} old? I'm not good at determining age... 😅`
          }
        }
      }
    );
  }
});

const { action, state, t } = engine;

/**
 * todo: проверить будет ли работать анимация как тут
 * @see https://youtu.be/8c34MKT2n6I?list=PLejGw9J2xE9WFYI08jbVMgI2moQdN3a2X&t=1809
 */

engine.withStory({
  'start': [
    action.showBackground(classRoom),
    action.showCharacter('Masaki Natsuko', 'ok', 'animate__animated animate__fadeInUp', 'left: 15%'),
    action.dialog('Masaki Natsuko', t('Привет! Ты <em>новенький</em>, не так ли?')),
    action.choice(
      [
        t('Да, я новенький!'),
        [
          action.dialog('Masaki Natsuko', t('Не хочешь зайти ко мне в гости сегодня? 😜')),
          action.choice(
            [
              t('Не откажусь!'),
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
    action.dialog('Nezuko', 'Привет, {{name}}! Сколько тебе лет? 😙'),
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
      () => {
        return state().age! <= 16 ? 'ok' : 'no';
      },
      {
        'ok': [
          action.hideCharacter('Masaki Natsuko'),
          action.dialog('Nezuko', t('Правда {{age}} лет? Загляни ко мне как-нибудь 😉')),
          action.end()
        ],
        'no': [
          action.dialog('Nezuko', t('Тебе {{age}} лет?? Не умею я определять возраст... 😅'), 'sad'),
          action.end()
        ]
      }
    )
  ]
});

render(() => <Novely />, document.body);

export { }