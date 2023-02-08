import { defineCharacter } from './character'
import { novely } from './novely'

const masaki = defineCharacter({
  name: 'Masaki Natsuko',
  color: 'orange',
  emotions: {
    ok: {
      body: {
        'left': 'https://i.imgur.com/tEwzVrM.png',
        'right': 'https://i.imgur.com/2EwP7ks.png',
      },
      head: 'https://i.imgur.com/LRDYGDk.png'
    },
    happy: {
      body: {
        'left': 'https://i.imgur.com/tEwzVrM.png',
        'right': 'https://i.imgur.com/2EwP7ks.png',
      },
      head: 'https://i.imgur.com/Ld1PLTn.png'
    },
    worried: {
      body: {
        'left': 'https://i.imgur.com/tEwzVrM.png',
        'right': 'https://i.imgur.com/2EwP7ks.png',
      },
      head: 'https://i.imgur.com/tegaScz.png'
    }
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

const engine = novely({
  target: target,
  characters: {
    'Masaki Natsuko': masaki,
    'Nezuko': nezuko
  }
});

const { action } = engine;

engine.withStory({
  'start': [
    action.showBackground('https://i.imgur.com/2CtCDxs.png'),
    action.showCharacter('Nezuko', 'ok', 'animate__animated animate__backInDown'),
    action.dialog('Nezuko', 'Привет! Ты <em>новенький</em>, не так ли?'),
    action.function(async () => {
      console.log('Function Ran!! Yay!')
    }),
    action.choice(
      ['Да, я новенький!', [action.jump('act-1')]],
      ['Нет, я уже давно учусь здесь.', [], () => { return false /** Нельзя выбрать */ }]
    )
  ],
  'act-1': [
    action.dialog(undefined, 'Произошло то, чего вы не ожидали'),
    // action.clear(),
    action.hideCharacter('Nezuko'), // пока что нет clear
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

engine.next('start');