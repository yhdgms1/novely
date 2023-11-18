# @novely/t9n

Примитивный t9n

## Использование

```ts title="main.ts"
import { createT9N, RU, EN } from '@novely/t9n';

const { t } = createT9N({
	ru: {
		internal: RU,
		pluralization: {
			years: {
				zero: 'лет',
				one: 'год',
				few: 'года',
				many: 'лет',
			},
		},
		actions: {
			capitalize: (str) => {
				return str.charAt(0).toUpperCase() + str.slice(1);
			},
		},
	},
	en: {
		internal: EN,
		pluralization: {
			years: {
				zero: 'years',
				one: 'year',
				few: 'years',
				many: 'years',
				other: 'years',
			},
		},
	},
});

const hi = t({
	ru: 'Меня зовут {{name%capitalize}}, мне {{age}} {{age@years}}! 👋',
	en: 'My name is {{name}}, I am {{age}} {{age@years}} old! 👋'
});

const str = hi('ru', { name: 'Артём', age: 17 });
```

## Credits

Части этого программного обеспечения защищены авторским правом соответствующих авторов и выпущены
по лицензии MIT:

- [templite](https://github.com/lukeed/templite), © Luke Edwards
