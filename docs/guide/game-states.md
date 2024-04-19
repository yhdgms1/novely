# Game States

When reading the documentation, you might notice the use of variables such as `preview`, `restoring`, and `goingBack`. These variables indicate the current state of the game.

## Restoring

Imagine if there were no saves in the game, you would have to go through the game from scratch every time. To do this, we have implemented the save and restore functionality.

Restoration is used in a fairly large number of places. When creating a new game it is restored from an empty save, during the loading of the save, as well as when going back, but we will talk about it later.

Some things should not be running during restore, such as showing ads.

```ts
engine.script({
  start: [
    engine.action.function(({ restoring }) => {
      if (!restoring) showAdv()
    })
  ]
})
```

## Going Back

The going back occurs as follows: an automatically created save is taken and it is loaded. This is how we solve the problem of mutation of the condition and some visual problems. So sometimes, in addition to `restoring`, you also need to use `goingBack`. It is especially important to complement the example with advertising.

```ts
engine.script({
  start: [
    engine.action.function(({ restoring, goingBack }) => {
      if (!restoring && !goingBack) showAdv()
    })
  ]
})
```

## Preview

In many games, you can see, when using saves, a screenshot of the game at the moment. But this approach is not suitable for the web.

::: details Why
Storing multiple images is not always available. It is not enough to store images in `IndexedDB` or in `localStorage`, because having cloud saves, the images will not be synchronized between devices. And storing them online is not always possible. Some services where you can publish the game offer only 200 kb of JSON storage.

In addition, the engine is focused on text adventures. Therefore, it is not uncommon for text to be displayed on the preview. If there are several translations, the text on the preview must match the selected language. This cannot be achieved using images.
:::

Therefore, to create a preview, we restore a separate version of the save. A lot of things shouldn't happen on the preview. Actually, the `preview` variable can be used for checking.

```ts
engine.script({
  start: [
    engine.action.function(({ restoring, goingBack, preview }) => {
      if (!restoring && !goingBack && !preview) showAdv()
    }),
  ]
})
```