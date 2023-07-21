# Story

Writing a story is quite simple - use the `withStory` method provided by engine. A story is an object with arrays of actions (more on them later). Each story must have a 'start' key.

```ts
const engine = novely(...);

engine.withStory({
  start: [
    engine.action.jump('dojo')
  ],
  dojo: [
    engine.action.showBackground('./dojo.jpeg'),
    engine.action.dialog('Senpai', 'This is how story defined...'),
    [
      engine.action.showBackground('./dojo-2.jpeg'),
      engine.action.dialog('Senpai', 'And arrays are used...')
    ]
  ]
});
```

You could also use special [story format](https://github.com/yhdgms1/novely/tree/main/packages/parser). No extra steps needed — it's already goes with [templates](/guide/getting-started#scaffolding-your-first-novely-project), all you need is to create a story file and import it:

```ts
import setupStory from './story.novely';

const story = setupStory({
  /**
   * JavaScript values goes here
   */
});

engine.withStory(story);
```

More on story format [here](/guide/story-format).