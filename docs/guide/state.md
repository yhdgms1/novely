# State

State is an essential part of any game. Novely has a special `state` function for working with state. You can access this function through the `novely` function or, alternatively, some actions will provide you with this function.

State can be any JavaScript value that can be serialized. By default, it is limited to JSON values.

Novely has two different types of state: "data" and, obviously, "state". Data is a global state shared across the entire game, while "state" is bound to each save.

You can give default values by using "data" and "state" keys in configuration.

## Default values

This is how you can declare default values.

```ts
import { novely } from '@novely/core';

const engine = novely({
  ...,
  // default data
  data: {
    purchases: {
      // Hat that can be purchased by viewing ads
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

As previously mentioned, there is the `engine.state` function. However, this function works with the main context, regardless of which context the game is currently running in. That's why we provide you with a `state` function that is bound to the context in certain actions.

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

It is recommended to use that provided function, on when possible add a check.

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