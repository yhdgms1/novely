import { ru, createI18N, self } from '@novely/i18n'

const { t } = createI18N(
  { ru },
  {
    ru: {
      'Привет! Ты <em>новенький</em>, не так ли?': self,
      'Привет, {{name}}! Сколько тебе лет? 😙': self,
      'Правда {int:age} лет? Загляни ко мне как-нибудь 😉': ({ age, pluralize }) => {
        const Age = pluralize({
          none: 'лет',
          one: 'год',
          some: 'года',
          many: 'лет'
        });

        return `Правда ${age} ${Age(age)}? Загляни ко мне как-нибудь 😉`;
      },
      'Тебе {int:age} лет?? Не умею я определять возраст... 😅': ({ age, pluralize }) => {
        const Age = pluralize({
          none: 'лет',
          one: 'год',
          some: 'года',
          many: 'лет'
        });

        return `Тебе ${age} ${Age(age)}?? Не умею я определять возраст... 😅`;
      },
    }
  }
)

export { t }