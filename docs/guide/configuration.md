# Configuration

After installation, you need to configure the engine. First you need to import important components

```ts
import { novely, EN } from "@novely/core";
```

The `novely` function is the main one here, this is the engine itself.

The game also requires localization - translation of parts of the interface, as well as the dialogues themselves, for this there is `EN` — translation for English language.

The basic configuration of the engine includes languages, renderer, characters, including their pictures, and the renderer.

```ts
// Import renderer and run novely

import { createSolidRenderer } from "@novely/solid-renderer";

const { renderer } = createSolidRenderer();

const engine = novely({
  renderer: renderer,
  languages: ["en"],
  translation: {
    en: {
      internal: EN
    }
  },
  characters: {},
});
```

That's it! And now let's look at the configuration in more detail.
