# @novely/particles

Particles effect based on [ts-particles](https://particles.js.org/).

## Usage

```ts
import { showParticles, hideParticles } from '@novely/particles';

const snow = {
  // @see https://particles.js.org/
  ...
};

engine.script({
  start: [
    /**
     * Will show particles
     */
    engine.action.custom(showParticles(snow)),
    /**
     * Will hide particles
     */
    engine.action.custom(hideParticles()),
  ]
});
```

## Additional Info

CSS `zIndex` of layer with particles is `2`.
