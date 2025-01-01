# @novely/dynamic-character

Will give a way to dynamically dress characters.

```ts
import { generateEmotions } from '@novely/dynamic-character';
import '@novely/dynamic-character/dist/index.css';
```

```ts
import Ryan_zombie from './assets/Ryan-zombie-body.png';
import Ryan_zombie_bottoms__shorts from './assets/Ryan-zombie-bottoms--shorts.png'
import Ryan_zombie_bottoms__jeans from './assets/Ryan-zombie-bottoms--jeans.png'
import Ryan_zombie_tops__pink_tshirt from './assets/Ryan-zombie-tops--pink-t-shirt.png';
import Ryan_zombie_tops__white_tshirt from './assets/Ryan-zombie-tops--white-t-shirt.png';

import Ryan_default from './assets/Ryan-default-body.png';
import Ryan_default_bottoms__shorts from './assets/Ryan-default-bottoms--shorts.png'
import Ryan_default_bottoms__jeans from './assets/Ryan-default-bottoms--jeans.png'
import Ryan_default_tops__pink_tshirt from './assets/Ryan-default-tops--pink-t-shirt.png';
import Ryan_default_tops__white_tshirt from './assets/Ryan-default-tops--white-t-shirt.png';

const { emotions: emotionsRyan, clothingData: clothingDataRyan } = generateEmotions({
	base: {
		default: asset(Ryan_default),
		zombie: asset(Ryan_zombie)
	},
	attributes: {
		bottoms: {
			shorts: {
				zombie: asset(Ryan_zombie_bottoms__shorts),
				default: asset(Ryan_default_bottoms__shorts)
			},
			jeans: {
				zombie: asset(Ryan_zombie_bottoms__jeans),
				default: asset(Ryan_default_bottoms__jeans)
			}
		},
		tops: {
			pink: {
				default: asset(Ryan_default_tops__pink_tshirt),
				zombie: asset(Ryan_zombie_tops__pink_tshirt)
			},
			white: {
				default: asset(Ryan_default_tops__white_tshirt),
				zombie: asset(Ryan_zombie_tops__white_tshirt)
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
		Ryan: {
			name: {
				en: 'Ryan Gosling',
			},
			color: '#000000',
			emotions: emotionsRyan
		},
	},
});

const { showPicker: showPickerYou, showCharacter: showYou } = createPickerActions(engine.typeEssentials, clothingDataKyo, {
	character: 'Ryan',
	defaultBase: 'default',
	defaultAttributes: {
		bottoms: 'jeans',
		tops: 'white'
	},
	translation: {
		en: {
			tabs: {
				base: 'Body',
				attributes: {
					bottoms: 'Bottoms',
					tops: 'Tops'
				}
			},
			base: {
				default: 'Default',
				zombie: 'Zombie'
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
				tablist: 'Clothing Options',
				variants: 'Options',
				slidesControl: 'Slides Control',
				prevSlide: 'Previous',
				nextSlide: 'Next',
				sumbit: 'Submit'
			}
		}
	}
});

```

## Credits

This project uses [Slidy](https://github.com/Valexr/Slidy) for drag-scrolling functionality.
