# @novely/live2d

Download [Cubism SDK](https://www.live2d.com/en/sdk/download/web/)

## Usage

```ts
import { initialize, addModel } from '@novely/live2d';

initialize({
	runtimeURL: '/live2dcubismcore.js',
	// runtimeFetch: (fetch) => {
	// 	requestIdleCallback(fetch, {
	// 		timeout: 1000
	// 	});
	// },
	// libraryFetch: (fetch) => {
	// 	requestIdleCallback(fetch, {
	// 		timeout: 1500
	// 	});
	// }
})
```

## Additional Info

Based on [Pixi](https://github.com/pixijs/pixijs) and [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) which is outdated and supports Cubism 4

It will probably be better to build something based on [CubismWebSamples](https://github.com/Live2D/CubismWebSamples/tree/develop/Samples/TypeScript/Demo) but pixi + pixi-live2d-display is super easy while their samples are not, code is hard to read and bundle size alone is almost the same as whole Pixi.js + pixi-live2d-display.
