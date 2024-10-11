# Clear

Clears the screen, hides all dialogs, and sets a black background.

::: danger
Avoid using clear directly, instead make another branch and [jump](/guide/actions/jump) into it.
:::

## Usage

```ts
engine.script({
  start: [engine.action.clear()],
});
```
