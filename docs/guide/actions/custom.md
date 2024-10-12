# Custom

Custom Actions allows you to extend the variety of actions you can use.

## Parameters

|  Name   |     Type      | Optional |  Description  |
| :-----: | :-----------: | :------: | :-----------: |
| handler | CustomHandler |    ❌    | Custom Action |

## Guide

### Key and ID

Let's explore how to make a simple custom action

```ts
import type { CustomHandler } from '@novely/core';

const showPicture: CustomHandler = () => {
  // currently does nothing
}

showPicture.id = Symbol.for('SHOW_PICTURE');
showPicture.key = `show-picture`;
```

But hey, what's `id` and `key` are doing?

`id` is used to distinguish actions of one type from another.

`key` is used to separate instances of the actions.

::: details Why do we need that
It's a common practice to create a function that will return `CustomHandler`. However, each time reference to the function will be different.

```ts
const createShowPicture = (url: string) => {
  const showPicture: CustomHandler = () => {
    // code here
  }

  showPicture.id = Symbol.for('SHOW_PICTURE');
  showPicture.key = `show-picture-${url}`;

  return showPicture;
}

createShowPicture('./mountain.jpeg') == createShowPicture('./mountain.jpeg') // false
```

That's why we use `id`:

```ts
createShowPicture('./mountain.jpeg').id == createShowPicture('./forest.jpeg').id // true
```

But can a mountain and a forest passed into `createShowPicture` be the same? No, that's why `key` exists.

```ts
createShowPicture('./mountain.jpeg').key == createShowPicture('./mountain.jpeg').key // true
createShowPicture('./mountain.jpeg').key == createShowPicture('./forest.jpeg').key   // false
```
:::

### Call Only Latest

In our example we create a `showPicture` action. Actions are called one after another. It can be nice, but during restore process or when player hits the back button we will probably need to show only the last picture.

So how to make the engine to call only latest custom action that we made?

```ts
const showPicture: CustomHandler = () => {}

showPicture.callOnlyLatest = true;
```

### Assets 

Engine does not know yet that our action uses assets. It's really simple to let it know:

```ts
const createShowPicture = (url: string) => {
  const showPicture: CustomHandler = () => {
    // code here
  }

  showPicture.id = Symbol.for('SHOW_PICTURE');
  showPicture.key = `show-picture-${url}`;
  showPicture.assets = [url]; // [!code ++]

  return showPicture;
}
```

::: details Why you should give engine that information
Engine has different [preload strategies](/guide/other-options#preloadassets). For blocking and automatic strategies it's necessary to know what your actions uses to preload it.

Preloading assets is used to avoid flashing and lagging.
:::

### Access the DOM

Now we want to actually make our action work. How?

```ts
const createShowPicture = (url: string) => {
  const showPicture: CustomHandler = ({ getDomNodes }) => {
    const { root, element } = getDomNodes(true); // [!code ++]
  }

  showPicture.id = Symbol.for('SHOW_PICTURE');
  showPicture.key = `show-picture-${url}`;
  showPicture.assets = [url];

  return showPicture;
}
```

To get the element in which we can render an image we need to pass `true` to the `getDomNodes` function. In case you want to render something you need to render it to that element.

Also you get the `root`. Novely can be ran in different roots, in example in an `iframe` to make the saves preview.
All the stuff with calculating window size and etc should be made with root and not the `document` global.

### Making an action that requires user action

Actions can return promises. We will use that, and also we will say that our action requires user action by setting `requireUserAction` property to `true`.

That way, we will 

```ts
const createShowPicture = (url: string) => {
  const showPicture: CustomHandler = ({ getDomNodes }) => {
    const { root, element } = getDomNodes(true);

    return new Promise<void>((resolve) => {
      const image = document.createElement('img');

      image.src = image;
      image.className = 'show-picture__image';

      image.addEveneListener('click', () => {
        image.remove();
        resolve();
      });

      element.appendChild(image);
    })
  }

  showPicture.id = Symbol.for('SHOW_PICTURE');
  showPicture.key = `show-picture-${url}`;
  showPicture.assets = [url];
  showPicture.requireUserAction = true;  // [!code ++]

  return showPicture;
}
```

```ts
const action: CustomHandler = ({
  data,
  clear,
  remove,
  getDomNodes,
  flags,
  lang,
}) => {
  const { goingBack, preview, restoring } = flags;

  /**
   * Preview is an environment in the saves page
   */
  if (preview) return;

  /**
   * @param insert Insert the Node to DOM or not. Not needed when you'r action does not render something
   */
  const { element, root } = getDomNodes(true);

  /**
   * Root Novely Node
   */
  root;

  /**
   * When `insert` is true, then HTMLDivElement, `null` otherwise
   */
  element;

  /**
   * Call without arguments to read the data
   */
  if (data().notification) {
    /**
     * Provide an argument to write the data
     */
    data({});
  }

  /**
   * Set the function that would be called when action would be cleared
   */
  clear(() => {
    data().notification?.destroy();
  });

  /**
   * Delete the action data and element
   */
  remove();

  if (goingBack) {
    // Player pressed the `Back` button
  }

  if (lang === "RU_ru") {
    console.log("Russian detected");
  }
};

//! Important // [!code warning]
/**
 * Key under which data from `get` function will be stored
 */
action.key = "notifications";

/**
 * This is used to know which action is which
 */
action.id = Symbol("notification");

/**
 * Assets (pictures urls) if any is rendered
 */
action.assets = []

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

Novely itself uses custom action in [particles](https://github.com/yhdgms1/novely/tree/main/packages/particles).
