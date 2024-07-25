# @novely/core

Novel Engine for creating interactive stories

- **Multilanguage**: Enable users to access content in multiple languages and handle pluralization in a simple and intuitive way
- **TypeScript**: Development with efficiency, type checking, and smart auto complete
- **Modularity in Mind**: Opt-in features, instead of opting-out! Lightweight and highly customizable

## Installation

- [Getting Started](https://novely.deno.dev/guide/getting-started.html)

## Documentation

You can find documentation on the [website](https://novely.deno.dev/guide/getting-started.html).

## Examples

```ts
import { createSolidRenderer } from '@novely/solid-renderer';
import { novely, EN } from '@novely/core';

const engine = novely({
  renderer: createSolidRenderer().renderer,
  translation: {
    en: {
      internal: EN
    }
  },
  characters: {
    Natsuki: {
      name: 'Natsuki',
      color: '#f388aa',
      emotions: {
        happy: './natsuki-happy.png'
      }
    }
  }
});

engine.script({
  start: [
    engine.action.showBackground('./school.png'),
    engine.action.showCharacter('Natsuki', 'happy'),
    engine.action.dialog('Natsuki', 'Whoa! I am very happy to see you!')
  ]
})
```
