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

### callOnlyLatest

In our example we create a `showPicture` action. Actions are called one after another. It can be nice, but during restore process or when player hits the back button we will probably need to show only the last picture.

So how to make the engine to call only latest custom action that we made?

```ts
const showPicture: CustomHandler = () => {}

showPicture.callOnlyLatest = true;
```

It will look at actions that come next and see if there are actions with same `id` and `key`, or actions equal by reference (`===`), or equal by code (`.toString()`).

### skipOnRestore

Instead of relying on logic of `callOnlyLatest`, you can write it yourself.

```ts
const showPicture: CustomHandler = () => {}

showPicture.skipOnRestore = (next) => {
  return next.some(([action, fn]) => action === 'custom' && fn.id === Symbol.for('SHOW_PICTURE'))
}
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
Engine has different [preload strategies](/guide/other-options#preloadassets). For automatic strategy it's necessary to know what your actions uses to preload it (or magic won't work).

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
    const { promise, resolve } = Promise.withResolvers();
    const { root, element } = getDomNodes(true);

    const image = document.createElement('img');

    image.src = image;
    image.className = 'show-picture__image';

    image.addEveneListener('click', () => {
      image.remove();
      resolve();
    });

    element.appendChild(image);

    return promise;
  }

  showPicture.id = Symbol.for('SHOW_PICTURE');
  showPicture.key = `show-picture-${url}`;
  showPicture.assets = [url];
  showPicture.requireUserAction = true;  // [!code ++]

  return showPicture;
}
```

### Clear

Actions can make dirty job, therefore there should be a way to clean up after action's run.

```ts
const drawSquare: CustomHandler = ({ getDomNodes, clear }) => {
  const { promise, resolve } = Promise.withResolvers<void>();
  const { element } = getDomNodes(true);

	element.style.cssText += `position: absolute; z-index: 1337; inset: 0;`

  const canvas = document.createElement('canvas');
  element.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  const loop = (time: DOMHighResTimeStamp) => {
    const r = Math.floor(128 + 127 * Math.sin(time * 0.001));
    const g = Math.floor(128 + 127 * Math.sin(time * 0.001 + 2));
    const b = Math.floor(128 + 127 * Math.sin(time * 0.001 + 4));

    ctx.fillStyle = `rgb(${r},${g},${b})`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

		raf = requestAnimationFrame(loop);
  }

  let raf = requestAnimationFrame(loop)
  let tid = setTimeout(resolve, 3000);

  return promise;
}

drawSquare.id = Symbol.for('DRAW_SQUARE');
drawSquare.key = 'draw-square';
```

You can create cool effects like one above. But what's gonna happen when you will press "exit"? Loop will still run. It will still draw a square in background.
Run it 100 times it will slow down player's phone and waste battery.

```ts
const drawSquare: CustomHandler = ({ getDomNodes, clear }) => {
  const { promise, resolve } = Promise.withResolvers<void>();
  const { element } = getDomNodes(true);

  element.style.cssText += `position: absolute; z-index: 1337; inset: 0;`

  const canvas = document.createElement('canvas');
  element.appendChild(canvas);

  // Remove canvas
  clear(() => canvas.remove()) // [!code ++]

  const ctx = canvas.getContext('2d')!;

  const loop = (time: DOMHighResTimeStamp) => {
    const r = Math.floor(128 + 127 * Math.sin(time * 0.001));
    const g = Math.floor(128 + 127 * Math.sin(time * 0.001 + 2));
    const b = Math.floor(128 + 127 * Math.sin(time * 0.001 + 4));

    ctx.fillStyle = `rgb(${r},${g},${b})`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    raf = requestAnimationFrame(loop);
  }

  let raf = requestAnimationFrame(loop)
  let tid = setTimeout(resolve, 3000);

  // Stop drawing loop
  clear(() => cancelAnimationFrame(raf)) // [!code ++]

  // Cancel timeout and resolve promise immediately
  clear(() => { cancelTimeout(tid); resolve() }); // [!code ++]

  return promise;
}

drawSquare.id = Symbol.for('DRAW_SQUARE');
drawSquare.key = 'draw-square';
```

These clear handlers will be called in reverse order (`cancelTimeout` first, then `cancelAnimationFrame`, remove canvas last).

Clear will be called in some cases, in example when player click "exit" button or "back" button.

### Remove

Remove function will call all registered cleanup handlers and remove element node.

### templateReplace

This function is very helpful when you want to manage translations. You can offer same experience to developers with your custom actions as with native actions. 

```ts
type Options<T> = T extends EngineTypes<infer $Lang, infer $State, any, any>
	? { hello: TextContent<$Lang, $State> }
	: never;

const createTextAction = <T>({ hello }: Options<T>) => {
  const handler: CustomHandler = ({ templateReplace, state }) => {
    console.log(templateReplace(hello, state))
  }

  handler.id = Symbol.for('TEXT_ACTION');
  handler.key = 'text-action';
}

createTextAction({
  hello: {
    en: 'Hello!',
    ru: (state) => state.polite ? 'Здравствуйте!' : 'Привет!',
    ja: ['こんにちは!']
  }
})
```

### Data

You need a way to store some data, pass it between actions, right? You can you `data` for that. 
The data is stored by `key` property on a function.

```ts
type Data = {
  name: string | undefined
}

const example: CustomHandler = ({ data, dataAtKey }) => {
  // Get data
  const _data = data<Data>();

  // Update data
  if (!_data.name) {
    _data.name = 'Luke Skywalker'
  }

  // Override data. You will replace underlying object with new one
  // Not recommended because can be confusing
  data<Data>({})

  _data.name;        // Luke Skywalker
  data<Data>().name; // undefined

  // Get data by key. Dark magic, not recommended to use
  dataAtKey<Data>('example').name // undefined
}

example.id = Symbol.for('EXAMPLE');
example.key = 'example';
```

### Paused

Engine [has a way](https://github.com/yhdgms1/novely/releases/tag/v0.51.0) to set focuses/blurred and paused/resumed state. It must be used when publising your game. 

You will receive `paused` store. You can subscribe to it to get current paused value. Naming is confusing, but that's actually both focus & pause combined.

```ts
type Data = {
  name: string | undefined
}

const example: CustomHandler = ({ paused, clear }) => {
  const unsubscribe = paused.subscribe((paused) => {
    if (paused) {
      // game is paused or blurred
    } else {
      // game is resumed and focused
    }
  })

  clear(unsubscribe)
}

example.id = Symbol.for('EXAMPLE');
example.key = 'example';
```

### Ticker

You might want to render something in `requestAnimationFrame`. But we offer you a ticker there. It automatically pauses when game pauses and resumes after.

```ts
const example: CustomHandler = ({ ticker, clear }) => {
  const unsubscribe = ticker.add((ticker) => {
    console.log(ticker.deltaTime)
  });

  ticker.start();

  clear(unsubscribe)
}

example.id = Symbol.for('EXAMPLE');
example.key = 'example';
```

### Request

There is a way to [customise used fetch function](/guide/other-options.html#fetch). Custom Actions should use that function if they need to fetch something. Don't make anybody patch globals.

The exception is when you need to use [XHR](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)

```ts
const example: CustomHandler = ({ request }) => {
  fetch('https://') // [!code --]
  request('https://') // [!code ++]
}

example.id = Symbol.for('EXAMPLE');
example.key = 'example';
```

Novely itself uses custom action in [particles](https://github.com/yhdgms1/novely/tree/main/packages/particles).
