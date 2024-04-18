# Block

Gives you the way to not repeat some actions multiple times, but have it in one place.

## Parameters

|  Имя  |        Type         | Optional | Description |
| :---: | :-----------------: | :------: | :---------: |
| scene | <code>string</code> |    ❌    |    Scene    |

## Usage

```ts
engine.script({
  // name it as you want
  "block:adv": [
    engine.action.condition(() => canShowAdv(), {
      true: [
        engine.action.text({
          en: "Adv will be shown",
        }),
        engine.action.function(async ({ restoring, goingBack, preview }) => {
          if (restoring || goingBack || preview) return;

          // double check
          if (canShowAdv()) {
            await showAdv();
          }
        }),
      ],
      false: [],
    }),
  ],
  start: [
    engine.action.say("Person", "Hello"),
    // call block when you need it
    engine.action.block("block:adv"),
  ],
});
```
