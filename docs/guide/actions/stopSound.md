# StopSound

Stops the sound. Maybe it is long and you want to stop it already

## Parameters

| Name  |  Type   | Optional |  Description   |
| :---: | :-----: | :------: | :------------: |
| audio | string  |    ❌    | Audio resource |

## Usage

```ts
engine.script({
  start: [
    action.stopSound("./assets/boom.mp3")
  ],
});
```
