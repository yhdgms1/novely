# Vibrate

Make the device physically vibrate

## Parameters

|    Name    |    Type    | Optional |      Description      |
| :--------: | :--------: | :------: | :-------------------: |
| ...pattern | `number[]` |    ❌    | The vibration pattern |

## Usage

```ts
engine.withStory({
  start: [
    engine.action.vibrate(
      100,
      30,
      100,
      30,
      100,
      200,
      200,
      30,
      200,
      30,
      200,
      200,
      100,
      30,
      100,
      30,
      100
    ),
  ],
});
```

You can refer to [MDN](https://developer.mozilla.org/ru/docs/Web/API/Navigator/vibrate) for more details.
