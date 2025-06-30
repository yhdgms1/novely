# @novely/live2d

This is a live2d integration for Novely.

Download [Cubism SDK](https://www.live2d.com/en/sdk/download/web/) and put `live2dcubismcore.js` or `live2dcubismcore.min.js` into `public` directory.

## Usage

You need a model that will be used. You can look at their [Samples](https://github.com/Live2D/CubismWebSamples/tree/develop/Samples/Resources).
The first step is to initialize Cubism SDK. You need to provide an URL to javascript file in `runtimeURL`.


Optionally, you can provide `runtimeFetch` and `libraryFetch` functions. These function have `fetch` callback which will start loading runtime or library when called. By default, runtime and library code will be loaded when model should be added, but you can load these early.

```ts
import { initialize, cubism } from '@novely/live2d';

initialize({
	runtimeURL: '/live2dcubismcore.js',
	runtimeFetch: (fetch) => {
		requestIdleCallback(fetch, {
			timeout: 1000
		});
	},
	libraryFetch: (fetch) => {
		requestIdleCallback(fetch, {
			timeout: 1500
		});
	}
})
```

Next step is to add models to the scene.

```ts
engine.script({
	start: [
		a.custom(
			cubism.add(
				'Mao',
				{ directory: 'Mao', model3: 'Mao.model3.json' },
				{
					onTap: ({ hit, model }) => {
						if (hit('Head')) {
							model.setRandomExpression()
						} else if (hit('Body')) {
							model.startRandomMotion('TapBody', 2)
						}
					},
					onIdle: ({ model }) => {
						model.startRandomMotion('Idle', 1)
					}
      	}
			)
		)
	]
})
```

## Limitations

A lot.
