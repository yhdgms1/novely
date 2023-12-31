# Jump

Performs a transition to the scene

## Parameters

| Name  |   Type   | Optional | Description |
| :---: | :------: | :------: | :---------: |
| scene | `string` |    ❌    |    Scene    |

## Usage

```ts
engine.script({
  start: [engine.action.jump("train")],
  train: [engine.action.showBackground("./train.jpeg")],
});
```
