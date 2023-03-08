# @novely/solid-renderer

Рендерер для @novely/core на основе solid.js

## Использование

Убедитесь, что у вас установлен [solid.js](https://www.solidjs.com/) и настроена сборка.

```tsx
// @see https://www.solidjs.com/docs/latest/api#render
import { render } from "solid-js/web";

import { novely, localStorageStorage } from "@novely/core";
import { createT9N } from "@novely/t9n";
import { createSolidRenderer } from "@novely/solid-renderer";

// Важно - импортируйте css!
import "@novely/solid-renderer/dist/index.css";

// Специфичная для `@novely/solid-renderer` настройка
const { createRenderer, Novely } = createSolidRenderer();

// Задайте начальные настройки
const engine = novely({
  languages: ["ru"],
  storage: localStorageStorage({ key: "my-story" }),
  renderer: createRenderer,
  characters: {
    Spike: {
      name: {
        ru: "Спайк",
      },
      color: "#99d41e",
      emotions: {
        ok: "./brawl-start-spike.png",
      },
    },
  },
  t9n: createT9N({
    ru: {
      pluralization: {},
      strings: {
        Hello: "Привет, я - Спайк. А как зовут тебя?",
      },
    },
  }),
});

// Опишите историю
engine.withStory({
  start: [],
});

// Запустите рендер
render(
  () => (
    <Novely
      style={{
        "--novely-settings-background-image": `url("./settings-background-image.png")`,
        "--novely-main-menu-background-image": `url("./main-menu-background-image.png")`,
        "--novely-saves-background-image": `url("./saves-background-image.png")`,
      }}
    />
  ),
  document.body
);
```

## CSS Variables API

Возможность настройки пользовательского интерфейса через [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) реализуется через следующие переменные:

| Name                                     | Default Value                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--novely-button-background-color`       | `#ffe9f3`                                                                                           |
| `--novely-button-border-color`           | `#ffc7df`                                                                                           |
| `--novely-button-color`                  | `#000000`                                                                                           |
| `--novely-button-hover-background-color` | `#ffffff`                                                                                           |
| `--novely-button-hover-border-color`     | `#ffc6d8`                                                                                           |
| `--novely-button-hover-color`            | `#ffb7a2`                                                                                           |
| `--novely-select-background-color`       | `#ffe9f3`                                                                                           |
| `--novely-select-border-color`           | `#ffc7df`                                                                                           |
| `--novely-select-color`                  | `#000000`                                                                                           |
| `--novely-dialog-color`                  | `#ffffff`                                                                                           |
| `--novely-dialog-border-color`           | `#ffffff`                                                                                           |
| `--novely-dialog-border-radius`          | `14px`                                                                                              |
| `--novely-dialog-box-shadow-color`       | `#00000072`                                                                                         |
| `--novely-dialog-background-image`       | `radial-gradient(#d6608998 20%, transparent 20%), radial-gradient(#d6608998 20%, transparent 20%))` |
| `--novely-dialog-background-color`       | `#f092b4d8`                                                                                         |
| `--novely-dialog-background-position`    | `0 0, 50px 50px`                                                                                    |
| `--novely-dialog-background-size`        | `100px 100px`                                                                                       |
| `--novely-settings-background-image`     | none                                                                                                |
| `--novely-main-menu-background-image`    | none                                                                                                |
| `--novely-saves-background-image`        | none                                                                                                |
