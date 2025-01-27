# Dynamic Character

Dynamic Character is a custom action that makes it possible for player to change the appearance of the characters.
You will need assets for each part that you want to be dynamic.

<div style="width: 100%; display: flex; justify-content: flex-start;">
  <img alt="" src="https://raw.githubusercontent.com/yhdgms1/novely/main/packages/dynamic-character/preview.jpg" style="max-width: 100%;" />
</div>

There is a `base` and `attributes` parts. You need to have at least one base.
Base can be anything but it's basically the body or the biggest difference between the variants of the character.
In that example we have `male` and `female` bases. For each base we have same attributes, but different assets.


Attribute is a clothing or kind of a minor change in appearance.
In that example we have `bottoms` which can be `jeans` or `shorts` and `tops` which can be `white` or `pink` t-shirt. 


It's not really necessary to be that way, all the canges can be expressed only with the base, it will probably be simplier.

## Installation

::: code-group
```bash [NPM]
npm i @novely/dynamic-character
```

```bash [PNPM]
pnpm add @novely/dynamic-character
```

```bash [Bun]
bun i @novely/dynamic-character
```

```bash [Yarn]
yarn add @novely/dynamic-character
```
:::

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

## Monetization

Let's get back to the configuration. We will need to declare the pricing for the items.

```ts
const { emotions: emotionsYou, createActions: createActionsYou } = generateEmotions({
	// Empty for the sake of readability of documentation
	base: {},
	attributes: {},
	pricing: {
		base: {
			male: 0,
			female: 0
		},
		attributes: {
			bottoms: {
				shorts: 0,
				jeans: 25
			},
			tops: {
				pink: 50,
				white: 0
			}
		}
	}
});
```

The declaration is pretty simple — if follows the `base` and `attributes` configuration with a `<number>` price as a value.
When everything will be configured when player will switch to the paid look instead of the "sumbit" button they will see the "buy" button with a price.

Now the buying logic should be implemented. We need to pass the `buy` and `isBought` function.

```ts
const isBought = (variant) => {
	return !!engine.data()[`is-${variant}-bought`]
}

// It is async!!
const buy = async (variant) => {
	if (isBought(variant)) return true;

	// Implement the actual buy logic
	const success: boolean = reallyBuyThat(variant);

	// Update the data
	engine.data((data) => {
		data[`is-${variant}-bought`] = success;

		return data;
	});

	// In case `true` is returned the look will be selected
	// Otherwise nothing will happen
	return success;
}

const showBottomAttributePicker = dynamicYou.showAttributePicker({
	name: 'bottoms',
	buy,
	isBought
});

engine.script({
	start: [
		showBottomAttributePicker,
	]
})
```