# AnimateCharacter

Animates the character

## Parameters

|    Name    |   Type   | Optional |                  Description                  |
| :--------: | :------: | :------: | :-------------------------------------------: |
| character  |  string  |    ❌    |                   Person ID                   |
|  timeout   |  number  |    ❌    | Timeout after that `classes` would be removed |
| ...classes | string[] |    ❌    |               Element.className               |

## Usage

```ts
engine.script({
  start: [
    engine.action.showCharacter(
      "Naruto",
      "horny",
    ),
    engine.action.dialog('Naruto', 'S-sakura-chan...')
    engine.action.animateCharacter(
      "Naruto",
      500,
      'pulse-animation-500-ms'
    ),
  ],
});
```
