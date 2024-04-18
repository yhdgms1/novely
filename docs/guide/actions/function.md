# Function

Runs the function

## Parameters

| Name |                      Type                       | Optional | Description |
| :--: | :---------------------------------------------: | :------: | :---------: |
|  fn  | <code>(restoring: boolean, goingBack: boolean, preview: boolean) => Thenable<void\></code> |    ❌    |  Function   |

## Usage

```ts
engine.script({
  start: [
    engine.action.function(async () => {
      console.log("got here");
    }),
    engine.action.function(({ restoring, goingBack, preview }) => {
      console.log(restoring, goingBack, preview)
    }),
    engine.action.function(({ restoring, goingBack, preview }) => {
      if (restoring || goingBack || preview) return;

      return new Promise((resolve) => {
        /**
         * Continue the game after ad is shown
         */ 
        sdk.adv.showFullscreenAdv({
          callbacks: {
            onClose() {
              resolve();
            },
            onError() {
              resolve();
            }
          }
        });
      })
    })
  ],
});
```
