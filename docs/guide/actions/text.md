# Text

Shows the text in the center of screen on a black background

## Parameters

|   Name   |    Type    | Optional |   Description    |
| :------: | :--------: | :------: | :--------------: |
| ...texts | `string[]` |    ❌    | Lines to display |

## Usage

```ts
engine.withStory({
  start: [
    engine.action.text(
      "If Kira gets caught, he is evil.",
      "If Kira rules the world, he is justice."
    ),
  ],
});
```
