import { createI18N, self } from '@novely/i18n'

const { t, extend } = createI18N(
  {
    ru: {
      'лет': {
        zero: 'лет',
        one: 'год',
        few: 'года',
        many: 'лет'
      }
    },
  },
  {
    ru: {
      'Привет! Ты <em>новенький</em>, не так ли?': self,
      'Привет, {{name}}! Сколько тебе лет? 😙': self,
      'Правда {{age}} лет? Загляни ко мне как-нибудь 😉': ({ age, pluralize }) => {
        return `Правда ${age} ${pluralize('лет', age)}? Загляни ко мне как-нибудь 😉`;
      },
      'Тебе {{age}} лет?? Не умею я определять возраст... 😅': ({ age, pluralize }) => {
        return `Тебе ${age} ${pluralize('лет', age)}?? Не умею я определять возраст... 😅`;
      },
    }
  }
);

const { t: tt } = extend(
  {
    ru: {
      'кусь': {
        zero: 'кусей',
        one: 'кусь',
        few: 'куся',
        many: 'кусей'
      },
    },
    en: {
      'кусь': {
        zero: 'кусей',
        one: 'кусь',
        few: 'куся',
        many: 'кусей'
      },
      'лет': {
        zero: 'years',
        one: 'year',
        many: 'years'
      }
    }
  },
  {
    ru: {
      'Кот даёт {{x}} кусей': ({ x, pluralize }) => {
        return `Кот даёт ${x} ${pluralize('кусь', x)}`;
      },
    },
    en: {
      'Кот даёт {{x}} кусей': ({ x, pluralize }) => {
        return `Can bites with ${x} ${pluralize('кусь', x)}`;
      },
      'Привет! Ты <em>новенький</em>, не так ли?': 'Hi! You are a <em>newbie<em>, is not it?',
    }
  }
);

tt('Кот даёт {{x}} кусей')

export { t }