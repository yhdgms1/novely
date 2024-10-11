# State

State is an essential part of any game. Novely has a special `state` function for working with state. Actions will provide this function to you, but also that function is provided by engine itself.

State can be any JavaScript value that can be serialized. By default, it is limited to JSON values, but can be extended by configuring `storage` and `cloneFunction`, [read more](/guide/other-options) about these.

Novely has two different types of state: global shared across the entire game "data" and "state" which is unique to every save in the game.

## Default values

Declaring default values will make it more convenient to work and also will give you type hints.

```ts
import { novely } from '@novely/core';

const engine = novely({
  ...,
  // default global data
  data: {
    purchases: {
      // Hat that can be purchased in example by viewing ads
      hat: false
    }
  },
  // default state
  state: {
    // player asked for age, this will be saved
    age: 0
  }
});
```

## Working with state

This is how you can read and update the state. When updating, you can pass a function that will modify the value or an object that will be deeply merged into the existing state.

```ts
// Read
engine.data()
// Update
engine.data({ purchases: { hat: true } })
engine.data((prev) => {
  prev.purchases.hat = true;

  return prev;
})

// Read
engine.state()
// Update
engine.state({ age: 15 })
engine.state((prev) => {
  prev.age = 15;

  return prev;
})
```

## State bound to context

As previously mentioned, there is the `engine.state` function. However, this function works with the main context, regardless of which context the game is currently running in. That's why we provide you with a `state` function that is bound to the context in certain actions. Some actiong will provide state itself, without ability to mutate it.

```ts
// You will learn about story and actions later
engine.story({
  start: [
    action.function(({ state }) => {
      // state function is being passed as an argument

      state({ ... })
    }),
  ]
})
```

If you can't use the `state` function bound to context, you should add some checks before calling the `engine.state`, but use it at your own risk.

```ts
engine.story({
  start: [
    action.function(({ preview, restoring }) => {
      if (preview || restoring) return;

      engine.state({ ... })
    }),
  ]
})
```