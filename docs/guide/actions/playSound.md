# PlaySound

Plays the sound. Sound does not stop when player goes to settings. By default it is not looped.

## Parameters

| Name  |  Type   | Optional |  Description   |
| :---: | :-----: | :------: | :------------: |
| audio | string  |    ❌    | Audio resource |
| loop  | boolean |    ✅    |  Loop or not   |

## Usage

```ts
engine.script({
  start: [
    action.playSound("./assets/boom.mp3")
  ],
});
```
