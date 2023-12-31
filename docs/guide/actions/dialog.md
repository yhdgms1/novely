# Dialog

Shows the text that someone says

## Parameters

|   Имя   |                 Type                  | Optional |            Description            |
| :-----: | :-----------------------------------: | :------: | :-------------------------------: |
| person  |               `string`                |    ⭕    | Person ID, any name, or undefined |
| content | <code>(() => string) \| string</code> |    ❌    |            Dialog text            |
| emotion |               `string`                |    ✔️    |          Person Emotion           |

## Usage

```ts
engine.script({
  start: [
    engine.action.dialog(
      "character id",
      "Show mini-person with 'happy' emotion",
      "happy"
    ),
    engine.action.dialog("???", engine.t("UnknownPersonLyrics")),
    engine.action.dialog(undefined, "No Name!"),
    engine.action.dialog("character id", "You'r age is {{age}}"),
  ],
});
```
