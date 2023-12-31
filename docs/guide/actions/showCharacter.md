# ShowCharacter

Shows the character

## Parameters

|   Name    |  Type  | Optional |    Description    |
| :-------: | :----: | :------: | :---------------: |
| character | string |    ❌    |     Person ID     |
|  emotion  | string |    ❌    |      Emotion      |
| className | string |    ✔️    | Element.className |
|   style   | string |    ✔️    |  style attribute  |

## Usage

```ts
engine.script({
  start: [
    engine.action.showCharacter(
      "Naruto",
      "horny",
      "animate__animated animate__repeat animate__shakeX",
      "left: 15%;"
    ),
  ],
});
```
