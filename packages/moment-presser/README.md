# @novely/moment-presser

## Usage

```ts
import type { CreateMomentPresserOptions } from '@novely/moment-presser';
import { createMomentPresser } from '@novely/moment-presser';
import '@novely/moment-presser/style.css';

import { extendAction } from '@novely/core';

const action = extendAction(engine.action, {
	momentPresser: (onPressed: CreateMomentPresserOptions<typeof engine.typeEssentials>['onPressed']) => {
		const momentPresser = createMomentPresser<typeof engine.typeEssentials>({
			onPressed: onPressed,
			translation: {
				en: {
					stop: 'Stop'
				}
			}
		})

		return ['custom', momentPresser];
	}
})
```

## CSS Properties

```css
:root {
  --moment-presser-main-arc-background: color;
  --moment-presser-inner-arc-background: color;
  --moment-presser-outer-arc-background: color;
  --moment-presser-pillar-background: color;
  --moment-presser-wide-match-zone-background: color;
  --moment-presser-narrow-match-zone-background: color;
  --moment-presser-aim-background: color;

  --moment-presser-button-background: color;
  --moment-presser-button-border: color;
  --moment-presser-circle-background: color;
  --moment-presser-circle-border: color;
  --moment-presser-circle-color: color;

  --moment-presser-caption-color: color;
}
```
