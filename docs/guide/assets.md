# Assets

For visual novels assets are the key feature. You might want high quality assets and both with small weight so they will be loaded quickly. However, older browsers may not support such formats as `.webp` or `.avif`. To provide support for both new browsers with cool formats, and not to forget about old browsers, you can use the `asset` function.

But it is fully optional. You can stick to `webp` for characters and backgrounds (as it supports transparency and wight not as much as png).

## How to use

You will need to pass image URL's in favourite first order. So which you want more should go first. Currently `asset` function support checking for `avif`, `webp`, and `jxl`.

```ts
asset('./img.avif', './img.webp', './img.png') // avif
asset('./img.webp', './img.png')               // webp
asset('./img.png')                             // png

asset('./img.png', './img.webp', './img.avif') // png
```

## Characters Usage

Asset function can be used for character emotions. 

```ts
import { novely, asset, EN } from '@novely/core';

const engine = novely({
  characters: {
    Ann: {
      name: 'Ann',
      color: '#D282A6',
      emotions: {
        happy: [
          asset('./ann_happy.avif', './ann_happy.webp', './ann_happy.png')
        ]
      }
    }
  }
})
```

## Backgrounds Usage

Can be used for backgrounds.

```ts
import { novely, asset, EN } from '@novely/core';

const forest = asset('./forest.webp', './forest.jpeg');
const forestPortrait = asset('./forest-portrait.webp', './forest-portrait..jpeg');

engine.script({
  start: [
    engine.action.showBackground(forest),
    engine.action.showBackground({
      '(orientation: portrait)': forestPortrait,
      '(orientation: landscape)': forest,
      'all': forest,
    })
  ]
})
```

## Audio Usage

Can be used for voices, music, and sounds.

```ts
import { novely, asset, EN } from '@novely/core';

const music2014playlist = asset('./music.ogg', './music.mp3');

engine.script({
  start: [
    engine.action.playMusic(music2014playlist)
  ]
})
```