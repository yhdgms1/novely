# @novely/t9n

Примитивный t9n

## Использование

```ts title="main.ts"
import { createT9N } from "@novely/t9n";

const { t } = createT9N({
  ru: {
    pluralization: {
      years: {
        zero: "лет",
        one: "год",
        few: "года",
        many: "лет",
      },
    },
    strings: {
      hi: "Меня зовут {{name}}, мне {{age}} {{age@years}}! 👋",
    },
  },
  en: {
    pluralization: {
      years: {
        zero: "years",
        one: "year",
        few: "years",
        many: "years",
        other: "years",
      },
    },
    strings: {
      hi: "My name is {{name}}, I am {{age}} {{age@years}} old! 👋",
    },
  },
});

const hi = t("hi");
const str = hi("ru", { name: "Артём", age: 16 });
```

## Credits

Части этого программного обеспечения защищены авторским правом соответствующих авторов и выпущены
по лицензии MIT:

- [templite](https://github.com/lukeed/templite), © Luke Edwards
