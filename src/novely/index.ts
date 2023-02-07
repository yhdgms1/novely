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
  name: 'Nezuko',
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
  characters: {
    'Masaki Natsuko': masaki,
    'Nezuko': nezuko
  }
});

engine.withStory({
  'start': [
    engine.action.showBackground('https://i.imgur.com/2CtCDxs.png'),
    engine.action.showCharacter('Masaki Natsuko', 'happy', 'animate__animated animate__backInDown'),
    engine.action.dialog('Masaki Natsuko', 'Привет! Ты <em>новенький</em>, не так ли?'),
    engine.action.wait(500),
    engine.action.hideCharacter('Masaki Natsuko', 'animate__animated animate__backOutUp', '', 1000),
    engine.action.showCharacter('Nezuko', 'sad', 'animate__animated animate__rubberBand'),
    engine.action.dialog('Nezuko', 'Почему ты сначала попривествовал <bold>её</bold>?', 'sad'),
    // engine.action.choice(
    //   ['Да, я новенький!', [engine.action.jump('act-1')]],
    //   ['Нет, я уже давно учусь здесь.', [], () => { return false /** Нельзя выбрать */ }]
    // )
  ],
  'act-1': [
    engine.action.dialog(undefined, 'Вы прошли игру!'),
    engine.action.clear(),
    engine.action.showCharacter('Nezuko', 'sad'),
    engine.action.condition(
      () => {
        let age = 13;

        return age >= 16 ? 'ok' : 'prison';
      },
      {
        'ok': [
          engine.action.end()
        ],
        'prison': [
          engine.action.jump('prison')
        ]
      }
    )
  ],
  'prison': []
});

const target = document.getElementById('app')!;

engine.setupStyling(target);
engine.withTarget(target);

engine.next('start');