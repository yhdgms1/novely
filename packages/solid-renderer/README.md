# @novely/solid-renderer

Renderer for @novely/core powered by SolidJS

## Использование

Make sure you have [SolidJS](https://www.solidjs.com/) installed and your bundler setup dones.

```tsx
// @see https://www.solidjs.com/docs/latest/api#render
import { render } from 'solid-js/web';

import { novely, localStorageStorage } from '@novely/core';
import { createT9N } from '@novely/t9n';
import { createSolidRenderer } from '@novely/solid-renderer';

// Важно - импортируйте css!
import '@novely/solid-renderer/dist/index.css';

// Специфичная для `@novely/solid-renderer` настройка
const { createRenderer, Novely } = createSolidRenderer();

// Задайте начальные настройки
const engine = novely({
	languages: ['ru'],
	storage: localStorageStorage({ key: 'my-story' }),
	renderer: createRenderer,
	characters: {
		Spike: {
			name: {
				ru: 'Спайк',
			},
			color: '#99d41e',
			emotions: {
				ok: './brawl-start-spike.png',
			},
		},
	},
	t9n: createT9N({
		ru: {
			pluralization: {},
			strings: {
				Hello: 'Привет, я - Спайк. А как зовут тебя?',
			},
		},
	}),
});

// Опишите историю
engine.withStory({
	start: [],
});

// Запустите рендер
render(
	() => (
		<Novely
			style={{
				'--novely-settings-background-image': `url("./settings-background-image.png")`,
				'--novely-main-menu-background-image': `url("./main-menu-background-image.png")`,
				'--novely-saves-background-image': `url("./saves-background-image.png")`,
			}}
		/>
	),
	document.body,
);
```

## CSS Variables API

Not documented yet.

## CSS Breakpoints

| Name                       | Description          |
| -------------------------- | -------------------- |
| `(max-aspect-ratio: 0.8)`  | Portrait            |
| `(max-aspect-ratio: 0.26)` | Hyper-Wide Portrait |
| `(max-aspect-ratio: 0.10)` | Thermometer Portrait |
