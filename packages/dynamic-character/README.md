# @novely/dynamic-character

Will give a way to dynamically dress characters.

<div style="width: 100%; display: flex; justify-content: flex-start;">
  <img alt="" src="https://raw.githubusercontent.com/yhdgms1/novely/main/packages/dynamic-character/preview.jpg" style="max-height: 20vh; max-width: 100vw;" />
</div>

## Usage

```ts
import { generateEmotions } from '@novely/dynamic-character';
import '@novely/dynamic-character/dist/index.css';
```

```ts
import { novely, asset, EN } from '@novely/core';

import You_female from './assets/You-female-body.png';
import You_female_bottoms__shorts from './assets/You-female-bottoms--shorts.png'
import You_female_bottoms__jeans from './assets/You-female-bottoms--jeans.png'
import You_female_tops__pink_tshirt from './assets/You-female-tops--pink-t-shirt.png';
import You_female_tops__white_tshirt from './assets/You-female-tops--white-t-shirt.png';

import You_male from './assets/You-male-body.png';
import You_male_bottoms__shorts from './assets/You-male-bottoms--shorts.png'
import You_male_bottoms__jeans from './assets/You-male-bottoms--jeans.png'
import You_male_tops__pink_tshirt from './assets/You-male-tops--pink-t-shirt.png';
import You_male_tops__white_tshirt from './assets/You-male-tops--white-t-shirt.png';

const { emotions: emotionsYou, createActions: createActionsYou } = generateEmotions({
	base: {
		male: asset(You_male),
		female: asset(You_female)
	},
	attributes: {
		bottoms: {
			shorts: {
				female: asset(You_female_bottoms__shorts),
				male: asset(You_male_bottoms__shorts)
			},
			jeans: {
				female: asset(You_female_bottoms__jeans),
				male: asset(You_male_bottoms__jeans)
			}
		},
		tops: {
			pink: {
				male: asset(You_male_tops__pink_tshirt),
				female: asset(You_female_tops__pink_tshirt)
			},
			white: {
				male: asset(You_male_tops__white_tshirt),
				female: asset(You_female_tops__white_tshirt)
			}
		}
	}
});

const engine = novely({
	...,
	translation: {
		en: {
			internal: EN
		}
	},
	characters: {
		You: {
			name: {
				en: 'You',
			},
			color: '#000000',
			emotions: emotionsYou
		},
	},
});

const dynamicYou = createActionsYou(engine, {
	character: 'You',
	defaultBase: 'male',
	defaultAttributes: {
		bottoms: 'jeans',
		tops: 'white'
	},
	translation: {
		en: {
			title: {
				base: 'Body',
				attributes: {
					bottoms: 'Bottoms',
					tops: 'Tops'
				}
			},
			base: {
				male: 'Male',
				female: 'Female'
			},
			attributes: {
				bottoms: {
					jeans: 'Jeans',
					shorts: 'Shorts'
				},
				tops: {
					pink: 'Pink t-shirt',
					white: 'White t-shirt'
				}
			},
			ui: {
				variants: 'Options',
				slidesControl: 'Slides Control',
				prevSlide: 'Previous',
				nextSlide: 'Next',
				sumbit: 'Submit',
				sumbit: 'Submit',
				buy: 'Buy'
			}
		}
	}
});

engine.script({
	start: [
		// Male or Female
		dynamicYou.showBasePicker(),
		// Jeans or Shorts
		dynamicYou.showAttributePicker({ name: 'bottoms' }),
		// Pink or White t-shirt
		dynamicYou.showAttributePicker({ name: 'tops' }),
		// Show the character
		dynamicYou.showCharacter(),
		// Admire the appearance :)
		engine.action.say("You", "Mirror, Mirror on the Wall, Who’s the Fairest of Them All?"),
		engine.action.end()
	]
})

```
