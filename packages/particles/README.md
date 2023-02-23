# @novely/particles

Эффект частиц как в Monogatari, но для Novely

## Требования

Для работы эффектов требуется установить [tsparticles-engine](https://www.npmjs.com/package/tsparticles-engine) и [tsparticles-slim](https://www.npmjs.com/package/tsparticles-slim)

## Использование

```ts
import { particles, hide } from '@novely/particles';

const snow = {
  // Смотрите больше здесь
  // @see https://particles.js.org/
  ...
};

engine.withStory({
  start: [
    /**
     * Показывает частицы
     */
    engine.action.custom(particles(snow)),
    /**
     * Скрывает частицы
     */
    engine.action.custom(hide()),
  ]
});
```

## Дополнительная информация

CSS `zIndex` слоя с частицами - 2.
