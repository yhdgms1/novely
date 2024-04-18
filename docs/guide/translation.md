# Translation

Translation into different languages plays a crucial role, especially for an engine that focused on large volumes of text.

## UI translation

First, you need to import the languages into the game and declare them. Yes, languages are not included in the engine by default

::: details Editing game translation

You can customize the translation of the interface as you want, the only thing is you should follow the interface translation declaration.

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
  CompleteText: string;
	GoForward: string;
	ExitDialogWarning: string;
	ExitDialogExit: string;
	ExitDialogBack: string;
	OpenMenu: string;
	CloseMenu: string;
	MusicVolume: string;
	SoundVolume: string;
	VoiceVolume: string;
}
```

You need only to overwrite some values.

```ts
import { EN } from "@novely/core";

const custom = {
  ...EN,
  Settings: "Options",
};
```
:::

The only thing you should do is to pass it to the `internal` key as follows:

```ts
import { EN } from "@novely/core";

const engine = novely({
  translation: {
    en: {
      internal: EN
    }
  }
})
```

## Lyric translation

A typical character's speech can be expressed using ordinary strings, or a function

```ts
engine.script({
  start: [
    // Typical character speech
    engine.action.say(
      'Person',
      'Someday we will win the final battle between goodness and neutrality'
    ),
    engine.action.say(
      'Person',
      () => Math.random() > 0.5 ? 'Some' : 'day...'
    )
  ]
})
```

But for translation into other languages, everything is actually quite simple! You just need to use an object where the language id will be used as the key.

```ts
engine.script({
  start: [
    // Translated character speech
    engine.action.say('Person', {
      en: 'Someday we will win the final battle between goodness and neutrality',
      ru: 'Когда-нибудь всё будет хорошо'
    }),
    engine.action.say('Person', {
      en: () => Math.random() > 0.5 ? 'Some' : 'day...',
      ru: () => Math.random() > 0.5 ? 'Когда' : 'нибудь...'
    })
  ]
})
```

The translation is written for all languages in one place. Therefore, it is actually much more convenient to manage translations in the game and avoid creating differences between games in different languages.

## Variables

We offer the ability to insert values from the state directly into strings. To do this, you need to write an variable reference between curly braces

```ts
engine.script({
  start: [
    engine.action.function(({ state }) => {
      state({ age: 47 })
    }),
    engine.action.say('Person', 'I am {{age}} years old.')
  ]
})
```

You could also use nested references.

```ts
engine.script({
  start: [
    engine.action.function(({ state }) => {
      state({ person: { age: 47 } })
    }),
    engine.action.say('Person', 'I am {{person.age}} years old.')
  ]
})
```

## Pluralization

What is pluralization? It is a process of changing nouns from singular to plural form.

```ts
const engine = novely({
  ...,
  translation: {
    en: {
      internal: EN,
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
    },
  }
})
```
::: details Pluralization object type

```ts
type PluralObject = {
  [Key in Intl.LDMLPluralRule]?: string;
};
```
:::

To use the pluralization functionality, after refering the variable, you need to put the `@` sign and refer to the plural name.

```ts
engine.script({
  start: [
    engine.action.function(({ state }) => {
      state({ person: { age: 1 } })
    }),
    engine.action.say('Person', 'I am {{person.age}} {{person.age@year}} old.')
  ]
})
```

## Actions

Also, we have actions for variables! In fact, this is a function that changes the value of a variable in any way

```ts
const engine = novely({
  ...,
  translation: {
    en: {
      internal: EN,
      plural: {},
      actions: {
        capitalize: (str) => {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
      }
    },
  }
})

engine.script({
  start: [
    engine.action.function(({ state }) => {
      state({ name: 'john' })
    }),
    engine.action.say('Person', 'My name is {{name%capitalize}}')
  ]
})
```

## Custom Languages

Although it may be rare, you can create your own language. This could be a mame language, or you could implement some form of censorship, such as excluding obscene words from a children's version.

```ts
const engine = novely({
  ...,
  translation: {
    'uwunglish': {
      internal: EN,
      // You should pass IETF BCP 47 language tag. It will be used for transliteration and other things
      tag: 'en-US',
      // You should pass name override. This thing will be shown instead of name that in that case cannot be determinated automatically
      nameOverride: 'UwU English'
    },
  }
})
```