# @novely/image-format-selector

Some image formats take up less weight, while providing better image quality. But they are not supported in all browsers. You can use the `selectFormat` function to select the appropriate format.

In code snippets we use the [Vite Imagetools Plugin](https://www.npmjs.com/package/vite-imagetools) to get different image formats.

## Basic Usage

```ts
import { novely } from '@novely/core'
import { selectFormat } from '@novely/image-format-selector'

import gibert_jpeg from './gibert.jpeg'
import gibert_webp from './gibert.jpeg?format=webp'

const engine = novely({
  characters: {
    'Gibert': {
      name: 'Gibert',
      color: '#ed5c87',
      emotions: {
        // You should use getter here
        get normal() {
          return selectFormat({
            webp: gibert_webp,
            fallback: gibert_jpeg
          })
        },
        get angry() {
          // Array
          return [
            selectFormat({ ... }),
            selectFormat({ ... })
          ]
        }
      },
    },
  },
})
```

## Wait until checked

```ts
import { novely } from '@novely/core'
import { selectFormat, formatsSupportChecked } from '@novely/image-format-selector'

import marseille_jpeg from './marseille.jpeg'
import marseille_webp from './marseille.jpeg?format=webp'

const engine = novely({
  ...
})

formatsSupportChecked.then(() => {
  const marseille = selectFormat({
    webp: marseille_webp,
    fallback: marseille_jpeg
  })

  engine.script({
    start: [
      engine.action.showBackground(marseille)
    ]
  })
})
```

## Formats Priority

You can order image priority using `setPriority` function. By default we try to use JPEG XL, then we try AVIF, then WEBP, and the fallback value. If none are present error is thrown.

```ts
import { setPriority } from '@novely/image-format-selector';

// If value not present then we will not try to use it
setPriority('webp', 'avif', 'fallback');
```

## Why Getters

To determine which format is supported we use promise-based approach. However, you need to pass a string to the engine. And although nothing prevents you from using the function without getter, in this case the fallback value will be selected. In addition, the value is cached, which means that fallback will always be selected.

Since images are not requested immediately, we use getter to get the correct value when it is needed.
