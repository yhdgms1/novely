# Configuration

After installation, you need to configure the engine. First you need to import important components

```ts
import { novely, localStorageStorage } from "@novely/core";
import { createT9N, EN } from "@novely/t9n";
```

The `novely` function is the main one here, this is the engine itself. It is important for the game to save the progress and then load it - this is where `localStorageStorage` appears.

The game also requires localization - translation of parts of the interface, as well as the dialogues themselves, for this there are functions `createT9N` - short for createTranslation, as well as EN - translation for English language.

The configuration of the engine includes languages, renderer, storage, translation, and characters, including their pictures.

Also, since a renderer is needed, let's create it:

```ts
import { createSolidRenderer } from "@novely/solid-renderer";

const solidRenderer = createSolidRenderer();
```

Now you can start configuration your game:

```ts
const translation = createT9N({
  en: {
    /**
     * Novely UI translation is under `internal` key
     */
    internal: EN,
    /**
     * Pluralization strings
     */
    pluralization: {},
    /**
     * Custom strings for you'r story
     */
    strings: {},
    /**
     * Some actions that can transform dynamic content inside the strings
     */
    actions: {},
  },
});

const engine = novely({
  languages: ["en"],
  renderer: solidRenderer.createRenderer,
  storage: localStorageStorage({ key: "my-game" }),
  t9n: translation,
  characters: {},
});
```

That's it! And now let's look at the configuration in more detail.
