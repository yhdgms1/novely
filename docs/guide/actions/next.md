# Next

Simply skips to the next action

Since Novely uses `index` in stories to load it is quite important when updating an already released game, if you are going to delete something, replace it with an action `next'.

## Usage

```ts
engine.script({
  start: [engine.action.next()],
});
```

## Example

When game was released, the script looked like this:

```ts
engine.script({
  start: [
    engine.action.dialog(
      "Jack",
      "Me and my boyfriend love each other, nothing can stop our love! 🏳️‍🌈"
    ), // index: 0
    engine.action.function(() => {}), // index: 1
    engine.action.dialog("Max", "Yes"), // index: 2
  ],
});
```

But then because of your [government and laws](https://en.wikipedia.org/wiki/Russian_gay_propaganda_law), your game becomes banned.

If you just delete the line, as in the example below...

```ts
engine.script({
  start: [
    engine.action.function(() => {}), // index: 0
    engine.action.dialog("Max", "Oh no"), // index: 1
  ],
});
```

The dialog with "Max" now have an index of `1` instead of `2`, the history will be loaded incorrectly, or a runtime error may occur at all when novely accesses a non-existent index.

Therefore, you should replace the deleted action with `next`:

```ts
engine.script({
  start: [
    engine.action.next(), // index: 0
    engine.action.function(() => {}), // index: 1
    engine.action.dialog("Max", "Oh no"), // index: 2
  ],
});
```
