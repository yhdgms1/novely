# @novely/particles

Эффект частиц на основе ts-particles

## Использование

```ts
import { showParticles, hideParticles } from '@novely/particles';

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
    engine.action.custom(showParticles(snow)),
    /**
     * Скрывает частицы
     */
    engine.action.custom(hideParticles()),
  ]
});
```

## Дополнительная информация

CSS `zIndex` слоя с частицами - 2.
