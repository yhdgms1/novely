# @novely/rive

Once you have a `.riv` file place it in your project and import according to your bundler.

```tsx
// Vite

import boyRiv from './assets/boy.riv?url'; // import as string url
import { show as startRive, remove as removeRive, animate as animateRive, hide as hideRive } from '@novely/rive';

engine.withStory({
	start: [
		/**
		 * On the story path start you need to hide all the used animations even before they were created
		 */
		hideRive('boy'),
		// ...
		startRive('boy', ({ init }) =>
			init({
				src: boyRiv, // pass src
			}),
		),
		animateRive('boy', 'AnimationName'),
		// ...
		removeRive('boy'),
	],
});
```
