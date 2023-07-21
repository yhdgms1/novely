# Translation

As shown earlier, the translation requires the `createT9N` function, as well as a suspicious EN object

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
import { EN } from "@novely/t9n";

const custom = {
  ...EN,
  Settings: "Options",
};
```

## Pluralization

Pluralization is configured as follows

```ts{8-15}
const translation = createT9N({
  en: {
    internal: EN,
    /**
     * Pluralization strings
     */
    pluralization: {
      'year': {
        'zero': 'years',
        'two': 'years',
        'few': 'years',
        'many': 'years',
        'other': 'years',
        'one': 'year',
      }
    },
    strings: {},
  },
});
```

The pluralization object is of the following type:

```ts
type PluralObject = {
  [Key in Intl.LDMLPluralRule]?: string;
};
```

## Strings

Strings are strings that can be used in dialogues (a character says something), and so on. They are quite simple to set up.

```ts{15}
const translation = createT9N({
  en: {
    internal: EN,
    pluralization: {
      'years': {
        'zero': 'years',
        'two': 'years',
        'few': 'years',
        'many': 'years',
        'other': 'years',
        'one': 'year',
      }
    },
    strings: {
      'Greeting': 'Hi, my name is {{data.name}} and I am {{data.years}} {{data.years@year}} old',
      'Fact': 'Did you know that {{data.name}} is {{data.name%backwards}} backwards?'
    },
    actions: {
      backwards: (string) => {
        return [...string].reverse().join('');
      }
    }
  },
});
```

## Usage

Once you have configured the engine, you can use the `t` function to get the content in the desired language. The example also uses the content enclosed between {{ and }} – it will be taken from state, which can be supplied via the `state` function, which is also available from the engine. When content between {{ and }} contain's `@` it will look for pluralization. Look at the following example:

```ts
engine.withStory({
  start: [
    engine.action.function(() => {
      engine.state({ data: { name: "Harley Quinn", age: 21 } });
    }),
    engine.action.dialog("Person", engine.t("Greeting")), // Will replace {{data.name}} with Herley Quinn, {{data.years}} with 21, and {{data.years@year}} with `years`
  ],
});
```

Also there is "actions" thing. When you type `%` and an action name after it, it will transform the content using the function defined in `actions` object. When no function found - it will ignore `%action`.

```ts
engine.withStory({
  start: [
    engine.action.function(() => {
      engine.state({ data: { name: "Lana" } });
    }),
    engine.action.dialog("Person", engine.t("Fact")), // Will replace {{data.name%backwards}} with result of `backwards` function with `Lana` as an argument
    engine.action.dialog("Player", "This is not funny..."),
  ],
});
```

Alongside with `strings` object in `createT9N` there is another way of translating the game:

```ts
engine.withStory({
  start: [
    engine.action.dialog(
      "Person",
      engine.t({
        en: "Hello",
        ru: "Привет"
      })
    )
  ]
});
```

It may be more convenient and visual. But, for example, for identical strings in different modules you can refer to `strings` key