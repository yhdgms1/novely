# Preload

Preload assets so they will not be loading on player's eyes

## Parameters

|  Name  |   Type   | Optional |            Description             |
| :----: | :------: | :------: | :--------------------------------: |
| source | `string` |    ❌    | Picture source you want to preload |

## Usage

```ts
var assets = {
  home: "./home.png",
  class: "./classroom.png",
};

engine.script({
  start: [
    // engine.action.preload(assets.home), // calling preload here will have no effect
    engine.action.showBackground(assets.home),
    engine.action.preload(assets.class), // preload is called before action that takes players's time to skip
    engine.action.dialog("Person", "Lorem ipsum dolor sit amet"),
    engine.action.showBackground(assets.class), // so when this action will be used image will already be loaded
  ],
});
```

You might want to look at more [preload options](/guide/other-options.html#preloadassets).