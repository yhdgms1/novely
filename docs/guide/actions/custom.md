# Custom

Action that lets you define custom actions

## Parameters

|  Name   |     Type      | Optional |  Description  |
| :-----: | :-----------: | :------: | :-----------: |
| handler | CustomHandler |    ❌    | Custom Action |

## Usage

```ts
const action: CustomHandler = (get, goingBack, preview) => {
  /**
   * Preview is an environment in the saves page
   */
  if (preview) return;

  /**
   * @param insert Insert the Node to DOM or not. Not needed when you'r action does not render something
   */
  const layer = get(true);

  /**
   * Root Novely Node
   */
  layer.root;

  /**
   * When `insert` is true, then HTMLElement, `null` otherwise
   */
  layer.element;

  /**
   * Call without arguments to read the data
   */
  if (layer.data().notification) {
    /**
     * Provide an argument to write the data
     */
    layer.data({});
  }

  /**
   * Set the function that would be called when action would be cleared
   */
  layer.clear(() => {
    layer.data().notification?.destroy();
  });

  /**
   * Delete the action data and element
   *
   * Could be used as pair of create-action and remove-action
   */
  layer.delete();

  if (goingBack) {
    // Player pressed the `Back` button
  }

};

//! Important // [!code warning]
/**
 * Key under which data from `get` function will be stored
 */
action.key = 'notifications';

/**
 * This is used to know which action is which
 */
action.id = Symbol('notification');

/**
 * Let's imagine you'r action show's some notifications
 * When restoring game action would be called lots of times and lots of notifications will be shown
 * But `callOnlyLatest` will make novely call only latest action of that type.
 *
 * The check is make using `action.id` OR `fn1 === fn2` OR `fn1.toString() === fn2.toString()`
 */
action.callOnlyLatest = true;

/**
 * Do not call `clear` when goingBack (when player clicked the `Back` button)
 */
action.skipClearOnGoingBack = true;

/**
 * When set to true, novely would wait until `resolve` function is called
 */
action.requireUserAction = true;

engine.script({
  start: [engine.action.custom(action)],
});
```

Novely itself uses that api in [video](https://github.com/yhdgms1/novely/tree/main/packages/video) and [particles](https://github.com/yhdgms1/novely/tree/main/packages/particles) custom actions.
