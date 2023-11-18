# Translation

## UI Translations

The UI translation has the following scheme:

```ts
interface InterfaceTranslation {
  NewGame: string;
  HomeScreen: string;
  ToTheGame: string;
  Language: string;
  NoSaves: string;
  LoadSave: string;
  Saves: string;
  Settings: string;
  Sumbit: string;
  GoBack: string;
  DoSave: string;
  Auto: string;
  Stop: string;
  Exit: string;
  Automatic: string;
  Manual: string;
  Remove: string;
  LoadASaveFrom: string;
  DeleteASaveFrom: string;
  TextSpeed: string;
  TextSpeedSlow: string;
  TextSpeedMedium: string;
  TextSpeedFast: string;
  TextSpeedAuto: string;
}
```

You can customize the translation of the interface as you want

```ts
import { EN } from "@novely/core";

const custom = {
  ...EN,
  Settings: "Options",
};
```

## Pluralization

Pluralization is configured as follows

```ts{8-17}
translation: {
  en: {
    tag: 'en-GB',
    internal: EN,
    /**
     * Pluralization strings
     */
    plural: {
      'year': {
        'zero': 'years',
        'two': 'years',
        'few': 'years',
        'many': 'years',
        'other': 'years',
        'one': 'year',
      }
    },
    actions: {
      backwards: (string) => {
        return [...string].reverse().join('');
      }
    },
  },
};
```

The pluralization object is of the following type:

```ts
type PluralObject = {
  [Key in Intl.LDMLPluralRule]?: string;
};
```

## Usage

Once you have configured the engine, you can get the content. The example also uses the content enclosed between {{ and }} – it will be taken from state, which can be supplied via the `state` function, which is also available from the engine. When content between {{ and }} contain's `@` it will look for pluralization. Look at the following example:

```ts
engine.withStory({
  start: [
    engine.action.function(() => {
      engine.state({ data: { name: "Harley Quinn", age: 21 } });
    }),
    engine.action.dialog(
      "Person",
      'Hi, my name is {{data.name}} and I am {{data.years}} {{data.years@year}} old'
    ), // Will replace {{data.name}} with Herley Quinn, {{data.years}} with 21, and {{data.years@year}} with `years`
  ],
});
```

Also there is "actions" thing. When you type `%` and an action name after it, it will transform the content using the function defined in `actions` object. When no function found - it will ignore `%action`.

```ts
engine.withStory({
  start: [
    engine.action.function(() => {
      engine.state({ data: { name: "Alice" } });
    }),
    engine.action.dialog(
      "Person",
      "Did you know that {{data.name}} is {{data.name%backwards}} backwards?"
    ), // Will replace {{data.name%backwards}} with result of `backwards` function with `Alice` as an argument
    engine.action.dialog("Player", "Very impressive..."),
  ],
});
```

For multiple languages you should provide an object with each language as a key

```ts
engine.withStory({
  start: [
    engine.action.dialog("Person", {
      en: "Hello",
      ru: "Привет"
    })
  ]
});
```
