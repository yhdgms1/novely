# HideCharacter

Hides the character

## Parameters

|   Name    |  Type  | Optional |                                             Description                                              |
| :-------: | :----: | :------: | :--------------------------------------------------------------------------------------------------: |
| character | string |    ❌    |                                              Person ID                                               |
| className | string |    ✔️    |                                          Element.className                                           |
|   style   | string |    ✔️    |                                           style attribute                                            |
| duration  | number |    ✔️    | The time after which to hide the character. It is necessary if you need to play the delete animation |

## Usage

```ts
engine.script({
  start: [
    engine.action.hideCharacter(
      "Naruto",
      "animate__animated animate__backOutDown",
      "left: 15%;",
      1000
    ),
  ],
});
```
