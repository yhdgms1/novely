# StopMusic

Stops the background music

## Parameters

| Name  |  Type  | Optional |  Description   |
| :---: | :----: | :------: | :------------: |
| audio | string |    ❌    | Audio resource |

## Usage

```ts
engine.script({
  start: [
    /**
     * The same address as used in `playMusic`
     */
    action.stopMusic("./assets/annoying-melody.mp3"),
  ],
});
```
