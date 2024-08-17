# PlayMusic

Plays the background music. Music does not stop when player goes to settings. Music is looped.

## Parameters

| Name  |  Type  | Optional |  Description   |
| :---: | :----: | :------: | :------------: |
| audio | string |    ❌    | Audio resource |

## Usage

```ts
engine.script({
  start: [action.playMusic("./assets/annoying-melody.mp3")],
});
```