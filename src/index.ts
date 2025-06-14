import { script } from './engine';
import { action as a } from './actions';
import { fountain, night } from './assets';
import { particles } from './particles';
import { getDeviceType } from './utilities';
import * as iuliia from "iuliia";

// Using asset does not have much sense because we access `.source` right away
// The image in the main menu should be loaded ASAP so it's better to use CSS and image-set()
// But for now I will keep it like that
document.body.style.setProperty('--novely-root-background-image', 'url("' + fountain.source + '")');

script({
  start: [
    a.showBackground('#000000'),
    a.text({
      en: 'You’re waking up...',
      ru: 'Ты только просыпаешься...'
    }),
    // a.playMusic(), // I don't have any music right now
    a.showParticles(particles),
    a.showBackground(fountain),
    a.text({
      en: 'And realize that you don’t know where you are.',
      ru: 'И понимаешь, что не знаешь, где находишься.'
    }),
    a.say('Me', {
      en: 'W-where am I?',
      ru: 'Г-где я?'
    }),
    a.talk('Darya', {
      en: 'In the demo of the Novely novel engine. Let me show you what I can do?',
      ru: 'В демке движка визуальных новелл Novely. Давай покажу тебе что я умею?'
    }),
    a.choice(
      {
        en: 'Make your choice',
        ru: 'Сделайте выбор'
      },
      {
        title: {
          en: 'Let’s go',
          ru: 'Давай'
        },
        children: [],
      },
      {
        title: {
          en: 'I’ll pass',
          ru: 'Откажусь'
        },
        children: [],
        active: () => false,
      }
    ),
    a.talk('Darya', {
      en: 'Well, it seems you had no choice.',
      ru: 'Что-ж, кажется, у тебя не было выбора.'
    }),
    a.talk('Darya', {
      en: 'But surely the concept of choice was clear?',
      ru: 'Но ведь концепция выбора была понятна?'
    }),
    a.choice(
      {
        en: 'Want to know more?',
        ru: 'Хочешь узнать подробнее?'
      },
      {
        title: {
          en: 'All clear',
          ru: 'И так всё ясно'
        },
        children: []
      },
      {
        title: {
          en: 'Yes, please',
          ru: 'Хочу'
        },
        children: [
          a.talk('Darya', {
            en: 'To create a choice dialog, you only need to specify a title, which is optional, and the choice options. Each option consists of the option text and a description of what will happen when it is selected. You can also make an option inactive or hide it completely.',
            ru: 'Для создания диалога выбора нужно лишь указать заголовок, который, впрочем, опционален, и варианты выбора. Каждый вариант — это текст варианта и описание того что будет происходить при его выборе. Так же вариант можно сделать неактивным или вовсе скрыть его.'
          }),
          a.say('Me', {
            en: 'And what does the description of what is happening look like?',
            ru: 'А как выглядит описание того что происходит?'
          }),
          a.talk('Darya', {
            en: 'Just like the rest of the story. In short, the story looks like an array of actions performed one after the other, for example, showing text or animating a character.',
            ru: 'Так же как и вся остальная история. Вкратце — история выглядит как массив выполняемых друг за другом действий, например, показ текста или анимация персонажа.'
          }),
        ],
      }
    ),
    a.say('Me', {
      en: 'The player makes a choice, and based on that choice, something happens. What else is there?',
      ru: 'Игрок делает какой-то выбор, и на основе этого выбора что-то происходит. Что есть ещё?'
    }),
    a.talk('Darya', {
      en: 'You can also create branches based on certain conditions. Each condition has its own branch. The next phrase I am going to say will be from the branch based on the condition.',
      ru: 'Ещё можно сделать ответвления на основе какого-то условия. Для каждого условия прописывается своя ветка. Следующая фраза которую я скажу будет как раз из ветки по условию.'
    }),
    a.condition(getDeviceType, {
      mobile: [
        a.talk('Darya', {
          en: 'And I know you’re on your phone right now.',
          ru: 'А я знаю что ты сейчас сидишь в телефоне.'
        })
      ],
      tablet: [
        a.talk('Darya', {
          en: 'You are currently using a tablet.',
          ru: 'Сейчас ты пользуешься планшетом.'
        })
      ],
      console: [
        a.talk('Darya', {
          en: 'Browser gaming on consoles!',
          ru: 'Браузерный гейминг на консолях!'
        })
      ],
      smarttv: [
        a.talk('Darya', {
          en: 'You’re currently on a smart TV?',
          ru: 'Ты сейчас на смарт-ТВ?'
        })
      ],
      wearable: [
        a.talk('Darya', {
          en: 'You play on your wearable? It’s too much even for me!',
          ru: 'Играешь на часах? Это слишком даже для меня!'
        })
      ],
      xr: [
        a.talk('Darya', {
          en: 'Wow, are you in XR?',
          ru: 'Ого, ты в дополненной реальности?'
        })
      ],
      embedded: [
        a.talk('Darya', {
          en: 'Are you running this on a toaster?',
          ru: 'Запускаешь это на тостере?'
        })
      ],
      desktop: [
        a.talk('Darya', {
          en: 'You’re sitting at the desktop or on a laptop?',
          ru: 'Ты сидишь за компьютером или за ноутбуком?'
        })
      ]
    }),
    a.setMood({
      en: 'to myself',
      ru: 'про себя'
    }),
    a.say('Me', {
      en: '<em>It seems that to better understand what is happening here, you need to look at the code... But maybe there is something else interesting?</em>',
      ru: '<em>Кажется, чтобы лучше понять что тут происходит нужно смотреть код... Но может есть ещё что-то интересное?</em>'
    }),
    a.setMood(''),
    a.talk('Darya', {
      en: 'By the way, what’s your name?',
      ru: 'Кстати, а как тебя зовут?'
    }),
    a.input(
      {
        en: 'Enter anything',
        ru: 'Введите что угодно'
      },
      ({ input, error, state, value }) => {
        error(input.validationMessage);

        if (!input.validationMessage) {
          // Supports only ru -> en conversion, I don't think there is a need for more
          state({ name: { ru: value, en: iuliia.translate(value, iuliia.MOSMETRO) } });
        }
      },
      (input) => {
        input.setAttribute('type', 'text');
        input.setAttribute('minlength', '2');
        input.setAttribute('maxlength', '46');
      },
    ),
    a.talk('Darya', {
      en: 'Nice to meet you, {{name.en}}! And I think you already know my name.',
      ru: 'Приятно познакомиться, {{name.ru}}! А моё имя ты, кажется, уже знаешь.'
    }),
    a.say('Me', {
      en: 'Let’s change the location, shall we?',
      ru: 'Давай, может, сменим локацию?'
    }),
    a.showBackground(night),
    a.talk('Darya', {
      en: 'No problem!',
      ru: 'Без проблем!'
    }),
    a.end(),
  ],
});
