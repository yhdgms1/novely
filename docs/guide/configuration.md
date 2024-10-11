# Configuration

You will see some TypeScript files with content like that:

::: code-group

```ts [engine.ts]
import { localStorageStorage, novely, EN } from '@novely/core';
import { createSolidRenderer } from '@novely/solid-renderer';

import lily from './assets/lily.png';

const { renderer } = createSolidRenderer();

const engine = novely({
	renderer,
	storage: localStorageStorage({ key: 'my-game' }),
	translation: {
		en: {
			internal: EN,
		},
	},
	characters: {
		Lily: {
			name: {
				en: 'Lily',
			},
			color: '#ed5c87',
			emotions: {
				normal: lily,
			},
		},
	},
});

export { engine };
```

```ts [story.ts]
import { engine } from './engine';

import outdoor from './assets/outdoor.png';

const { script, action: a } = engine;

script({
	start: [
		a.showBackground(outdoor),
		a.showCharacter('Lily', 'normal'),
    a.say('Lily', 'Hello, Player!'),
	],
});

```
:::

To configure the engine you should work with `engine.ts` file. For basic setup read next chapters, starting with [state](/guide/state). For more detailed configuration you can see all available options [here](/guide/other-options)