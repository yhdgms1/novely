# Block

Gives you the way to not repeat some actions multiple times, but have it in one place.

## Parameters

|  Имя  |        Type         | Optional | Description |
| :---: | :-----------------: | :------: | :---------: |
| scene | <code>string</code> |    ❌    |    Scene    |

## Usage

```ts
engine.withStory({
  // name it as you want
  "block:adv": [
    engine.action.condition(() => canShowAdv(), {
      true: [
        engine.action.text(
          t({
            en: "Adv will be shown",
          })
        ),
        engine.action.function(async (restoring, goingBack) => {
          if (restoring || goingBack) return;

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
    engine.action.dialog("Mistress", "Hello, little puppy"),
    // call block when you need it
    engine.action.block("block:adv"),
  ],
});
```
