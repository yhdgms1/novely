# Particles

Show's Particles in the background

## Installation

```bash
npm i @novely/particles
```

## Usage

```ts
import { particles, hide } from '@novely/particles';

const snow = {
  // @see https://particles.js.org/
  ...
};

engine.script({
  start: [
    /**
     * Show
     */
    engine.action.custom(particles(snow)),
    /**
     * Hide
     */
    engine.action.custom(hide()),
  ],
});
```
