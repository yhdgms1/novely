# @novely/i18n

Примитивный i18n

## Использование

```ts title="main.ts"
import { createI18N, ru, en } from "@novely/i18n";

const { t } = createI18N(
  { ru, en },
  {
    ru: {
      "Я купила {int:x} яблок": ({ x, pluralize }) => {
        const apples = pluralize({
          none: "яблок",
          one: "яблоко",
          some: "яблока",
          many: "яблок",
        });

        // `x` - `number`
        return `Я купила ${x} ${apples(x)}`;
      },
      // Значение равно ключу
      "Ну привет, мальчик-неудачник": createI18N.self,
      // `{str:name}` будет заменён на `{{name}}`
      "Тебя зовут {str:name}? Красивое имя": createI18N.self,
      // Используем синтаксис rosetta сразу
      "Я считаю, что {{food}} - это вкусно": (params) => {
        // `params.food` - error!
        return "Я считаю, что {{food}} - это вкусно";
      },
    },
    en: {
      "Я купила {int:x} яблок": ({ x, pluralize }) => {
        const apples = pluralize({
          none: "apples",
          one: "apple",
          some: "apples",
        });

        return `I'v bought ${x} ${apples(x)}`;
      },
      "Ну привет, мальчик-неудачник": "Well hi, loser boy",
      // prettier-ignore
      "Тебя зовут {str:name}? Красивое имя": "You'r name is {{name}}? What a nice name!",
      "Я считаю, что {{food}} - это вкусно": (params) => {
        return "I think that {{food}} is tasty";
      },
    },
  }
);
```
