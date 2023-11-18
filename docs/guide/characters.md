# Characters

Characters are characters that appear on the screen. They may have different emotions. Characters can be animated through css classes, and also use style for styling. The name, color, and emotions must be known about the character. You can also change the name of the character depending on the language.

Let's create a character:

```ts
const engine = novely({
  renderer,
  storage,
  translation,
  languages: ["en", "ru"],
  characters: {
    Naruto: {
      /**
       * Name could be just a string, this way that name will be shown in all the languages
       */
      name: "Naruto",
      /**
       * Color may be used in dialogs, when the character's name is shown
       */
      color: "#dedd4e",
      emotions: {
        /**
         * This could be just a path to an image
         */
        happy: "./naruto-happy.png",
        /**
         * But also an object, which contains the head, and body parts of a character
         */
        horny: {
          /**
           * Head in this example is `horny`
           */
          head: "./naruto-horny__head.png",
          /**
           * But body uses regular (there is no 'horny' or any other thing) texture
           */
          body: {
            left: "./naruto__body-left.png",
            right: "./naruto__body-left.png",
          },
        },
      },
    },
    Sakura: {
      /**
       * Name here is the object, containing 'en' and 'ru' variants
       * When using object all variants of supported languages should be present
       */
      name: {
        en: "Sakura",
        ru: "Сакура",
      },
      color: "#eebdc3",
      emotions: {
        scared: "./sakura-scared.webp",
      },
    },
    Tsunade: {
      name: {
        /**
         * Name can also include dynamic content, or be just a `{{custom_player_name}}`
         */
        en: "Tsunade │ Debts: {{debts}}",
        ru: "Цунаде │ Долги: {{debts}}",
      },
      color: "#e9d9bd",
      /**
       * This option may be an empty object
       */
      emotions: {},
    },
  },
});
```
