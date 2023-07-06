import { render } from 'solid-js/web'
import { novely, localStorageStorage } from '@novely/core'
import { createT9N, RU, EN } from '@novely/t9n'
import { createSolidRenderer } from '@novely/solid-renderer'

// import { video } from '@novely/video'
import { particles, hide } from '@novely/particles'
import { snow, fireflies } from './particles'

import outdoor from './assets/outdoor.png'
import lily_ok from './assets/lily.png'

const { createRenderer, Novely } = createSolidRenderer();

const engine = novely({
  languages: ['ru', 'en'],
  storage: localStorageStorage({ key: 'novely-saves' }),
  renderer: createRenderer,
  characters: {
    'Lily': {
      name: {
        ru: 'Лилия',
        en: 'Lily',
      },
      color: '#ed5c87',
      emotions: {
        ok: lily_ok
      },
    },
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
        'StartText': 'На улице прекрасный день, ты открываешь глаза и встречаешь...',
        'HowOldAreYou': 'Привет, {{name}}! Сколько тебе лет? 😙',
        'ReallyAgeYears': 'Правда {{age}} {{age@years}}? Загляни ко мне как-нибудь',
        'YouAreAgeYears': 'Тебе {{age}} {{age@years}}? Старик',
        'EnterYourName': 'Введи имя',
        'EnterYourAge': 'Введи возраст',
        'ChoiceText': 'Текст выбора',
        'ChoiceVariant': 'Вариант выбора'
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
        'StartText': "It's a beautiful day outside, you open your eyes and meet...",
        'HowOldAreYou': 'Hi, {{name}}! How old are you? 😙',
        'ReallyAgeYears': 'Really {{age}} {{age@years}}? Drop by and see me sometime',
        'YouAreAgeYears': "You are {{age}} {{age@years}} old? Geezer",
        'EnterYourName': 'Enter your name',
        'EnterYourAge': 'Enter your age',
        'ChoiceText': 'Choice text',
        'ChoiceVariant': 'Choice variant'
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

engine.withStory({
  'start': [
    action.custom(particles(fireflies)), // should not be visible
    action.jump('next')
  ],
  'next': [
    action.custom(hide()),
    action.text(t('StartText')),
    action.custom(particles(snow)),
    action.showBackground(outdoor),
    action.showCharacter('Lily', 'ok'),
    action.input(
      t('EnterYourName'),
      ({ input, error }) => {
        error(input.validationMessage);
        state({ name: input.value });
      },
      (input) => {
        input.setAttribute('minlength', '2');
        input.setAttribute('maxlength', '16');
      }
    ),
    action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__backInUp'),
    action.dialog('Lily', t('HowOldAreYou')),
    action.input(
      t('EnterYourAge'),
      ({ input, error }) => {
        error(input.validationMessage);
        state({ age: input.valueAsNumber })
      },
      (input) => {
        input.setAttribute('type', 'number');
        input.setAttribute('min', '6');
        input.setAttribute('max', '99');
      }
    ),
    action.condition(
      () => state().age <= 18 ? 'ok' : 'no',
      {
        'ok': [
          action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__backInUp'),
          action.dialog('Lily', t('ReallyAgeYears'), 'ok'),
          action.exit(),
        ],
        'no': [
          action.animateCharacter('Lily', 1000, 'animate__animated', 'animate__backInUp'),
          action.dialog('Lily', t('YouAreAgeYears')),
          action.exit()
        ]
      }
    ),
    action.choice(
      t('ChoiceText'),
      [
        t('ChoiceVariant'),
        [
          action.exit()
        ]
      ]
    ),
    action.end()
  ]
});

render(() => (
  <Novely
    style={{
      '--novely-settings-background-image': `url(${outdoor})`,
      '--novely-main-menu-background-image': `url(${outdoor})`,
      '--novely-saves-background-image': `url(${outdoor})`,
    }}
  />
), document.body);

export { }
