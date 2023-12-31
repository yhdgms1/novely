# Function

Runs the function

## Parameters

| Name |                      Type                       | Optional | Description |
| :--: | :---------------------------------------------: | :------: | :---------: |
|  fn  | <code>(restoring: boolean, goingBack: boolean) => Thenable<void\></code> |    ❌    |  Function   |

## Usage

```ts
engine.script({
  start: [
    engine.action.function(async () => {
      console.log("got here");
    }),
    engine.action.function((restoring, goingBack) => {
      console.log(restoring, goingBack)
    }),
    engine.action.function((restoring, goingBack) => {
      if (restoring || goingBack) return;

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
