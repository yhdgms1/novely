# Voice

Plays the voice. It does not loop. When one voice plays previous voice stops playing.

## Parameters

| Name  |  Type  | Optional |  Description   |
| :---: | :----: | :------: | :------------: |
| audio | string |    ❌    | Audio resource |

## Usage

```ts
engine.script({
  start: [action.voice("./assets/hello.mp3")],
});
```
