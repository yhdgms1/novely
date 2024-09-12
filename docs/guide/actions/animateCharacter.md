# AnimateCharacter

Animates the character

## Parameters

|   Name    |  Type  | Optional |                                        Description                                        |
| :-------: | :----: | :------: | :---------------------------------------------------------------------------------------: |
| character | string |    ❌    |                                         Person ID                                         |
| className | number |    ❌    | [`Element.className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) |

## Usage

```ts
engine.script({
  start: [
    engine.action.showCharacter(
      "Naruto",
      "horny",
    ),
    engine.action.animateCharacter(
      "Naruto",
      'animated pulse-animation-500-ms'
    ),
    engine.action.say('Naruto', 'S-sakura-chan...')
  ],
});
```
