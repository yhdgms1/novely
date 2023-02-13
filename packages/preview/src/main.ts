import 'animate.css';
import 'normalize.css'

import { novely, defineCharacter, localStorageStorage } from '@novely/core'

import { createDomRenderer } from '@novely/dom-renderer'

import '@novely/dom-renderer/dist/index.css'

import classRoom from './assets/class.png';
import bedroomRoom from './assets/bedroom.png';
import masakiNatsukoOk from './assets/Masaki Natsuko.png';

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

const engine = novely({
  storage: localStorageStorage({ key: 'novely-' }),
  renderer: createDomRenderer(document.body),
  characters: {
    'Masaki Natsuko': masaki,
    'Nezuko': nezuko
  }
});

const { action, state } = engine;

engine.withStory({
  'start': [
    action.showBackground(classRoom),
    action.showCharacter('Masaki Natsuko', 'ok', 'animate__animated animate__fadeInUp', 'left: 15%'),
    action.dialog('Masaki Natsuko', 'Привет! Ты <em>новенький</em>, не так ли?'),
    action.choice(
      [
        'Да, я новенький!',
        [
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
    action.clear(),
    action.wait(400),
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
    action.dialog('Nezuko', 'Привет, {{name}}!')
  ]
});

engine.render();

export { }