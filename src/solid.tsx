import 'animate.css';
import 'normalize.css'

import { render } from 'solid-js/web'
import { novely, defineCharacter, localStorageStorage } from './novely'
import { createSolidRenderer } from './novely/solid-renderer'

// import chingchenghanji from './assets/ChingChengHanji.mp3';
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

/**
 * todo: проверить будет ли работать анимация как тут
 * @see https://youtu.be/8c34MKT2n6I?list=PLejGw9J2xE9WFYI08jbVMgI2moQdN3a2X&t=1809
 */

let name = '';

engine.withStory({
  'start': [
    action.showBackground(classRoom),
    action.showCharacter('Masaki Natsuko', 'ok', 'animate__animated animate__backInDown', 'left: 15%'),
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
    action.showCharacter('Nezuko', 'ok', 'animate__animated animate__pulse', 'right: 15%'),
    action.dialog('Nezuko', 'Сестрёнка, кого ты привела?!'),
    action.dialog('Masaki Natsuko', 'Знакомься, это'),
    action.input(
      'Введите ваше имя',
      ({ input, error }) => {
        error(input.validationMessage);
        name = input.value;
      },
      (input) => {
        input.setAttribute('minlength', '2');
        input.setAttribute('maxlength', '16');
      }
    ),
    action.dialog('Nezuko', () => `Привет, ${name}!`)
    // action.input(
    //   'Введите ваш возраст',
    //   ({ input, error }) => {
    //     error(Number.isFinite(input.valueAsNumber) ? input.valueAsNumber < 14 ? 'Слишком маленький возраст' : '' : 'Неправильное число')
    //   },
    //   (input) => {
    //     input.type = 'number';
    //   }
    // ),
    // action.condition(
    //   () => {
    //     let age = 13;

    //     return age >= 16 ? 'ok' : 'prison';
    //   },
    //   {
    //     'ok': [
    //       action.end()
    //     ],
    //     'prison': [
    //       action.jump('prison')
    //     ]
    //   }
    // )
  ]
});

engine.render();

render(() => <Novely />, target);

export { }