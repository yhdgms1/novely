import 'animate.css';
import 'normalize.css'

import { render } from 'solid-js/web'
import { novely, defineCharacter, localStorageStorage } from './novely'
import { createSolidRenderer } from './novely/solid-renderer'

// import chingchenghanji from './assets/ChingChengHanji.mp3';
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

const target = document.getElementById('app')!;

const { createLayout, createRenderer, Novely } = createSolidRenderer();

const engine = novely({
  target: target,
  storage: localStorageStorage({ key: 'novely-' }),
  layout: createLayout,
  renderer: createRenderer,
  characters: {
    'Masaki Natsuko': masaki,
    'Nezuko': nezuko
  }
});

const { action } = engine;

engine.withStory({
  'start': [
    action.showBackground('https://i.imgur.com/2CtCDxs.png'),
    action.showCharacter('Masaki Natsuko', 'ok', 'animate__animated animate__backInDown', 'left: 15%'),
    action.dialog('Masaki Natsuko', 'Привет! Ты <em>новенький</em>, не так ли?', 'ok'),
    action.hideCharacter('Masaki Natsuko', 'animate__animated animate__backOutUp', 'left: 15%', 1000),
    action.choice(
      ['Да, я новенький!', [action.jump('act-1')]],
      ['Нет, я уже давно учусь здесь.', [], () => { return false /** Нельзя выбрать */ }]
    )
  ],
  'act-1': [
    action.dialog(undefined, '...'),
    // action.clear(),
    action.input(
      'Введите ваш возраст',
      ({ input, error }) => {
        error.textContent = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber < 14 ? 'Слишком маленький возраст' : '' : 'Неправильное число'

        // store.
      },
      (input) => {
        input.type = 'number';
      }
    ),
    action.condition(
      () => {
        let age = 13;

        return age >= 16 ? 'ok' : 'prison';
      },
      {
        'ok': [
          action.end()
        ],
        'prison': [
          action.jump('prison')
        ]
      }
    )
  ],
  'prison': [
    action.showBackground('https://kartinkin.net/uploads/posts/2021-07/1627201958_4-kartinkin-com-p-shkola-tyurma-anime-kieshi-anime-krasivo-4.jpg'),
    action.dialog(undefined, 'Ей было 13 лет. Вы попали в тюрьму!')
  ]
});

engine.render();

render(() => <Novely />, target);

export { }