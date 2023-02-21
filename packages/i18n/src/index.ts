export { createI18N, self } from './i18n'

// import { en, ru } from './plural'
// import { createI18N, self } from './i18n'

// const { t } = createI18N(
//   { ru, en },
//   {
//     ru: {
//       яблоки: {
//         none: "яблок",
//         one: "яблоко",
//         some: "яблока",
//         many: "яблок",
//       }
//     },
//     en: {
//       яблоки: {
//         none: "apples",
//         one: "apple",
//         some: "apples",
//       }
//     }
//   },
//   {
//     ru: {
//       "Я купила {{x}} яблок": ({ x, pluralize }) => `Я купила ${x} ${pluralize('яблоки', x)}`,
//       "Ну привет, мальчик-неудачник": self,
//       "Тебя зовут {{name}}? Красивое имя": self,
//     },
//     en: {
//       "Я купила {{x}} яблок": ({ x, pluralize }) => `I'v bought ${x} ${pluralize('яблоки', x)}`,
//       "Ну привет, мальчик-неудачник": "Well hi, loser boy",
//       // prettier-ignore
//       "Тебя зовут {{name}}? Красивое имя": "You'r name is {{name}}? What a nice name!",
//     }
//   }
// );
