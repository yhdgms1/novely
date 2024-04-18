# Say

Shows the text that someone says. Unline [Dialog](/guide/actions/dialog.md) works only with characters and does not support emotions.

## Parameters

|   Имя   |     Type      | Optional |    Description     |
| :-----: | :-----------: | :------: | :----------------: |
| person  |   `string`    |    ❌    | Person ID strictly |
| content | `TextContent` |    ❌    |       Lyrics       |

## Usage

```ts
engine.script({
  start: [
    engine.action.say(
      "character id",
      "text",
    )
  ],
});
```
