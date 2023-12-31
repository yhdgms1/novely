# Story

Writing a story is quite simple - use the `script` method provided by engine. A story is an object with arrays of actions (more on them later). Each story must have a 'start' key.

```ts
const engine = novely(...);

engine.script({
  start: [
    engine.action.jump('dojo')
  ],
  dojo: [
    engine.action.showBackground('./dojo.jpeg'),
    engine.action.dialog('Senpai', 'This is how story defined...'),
    [
      engine.action.showBackground('./dojo-2.jpeg'),
      engine.action.dialog('Senpai', 'And arrays can be used there')
    ]
  ]
});
```

You could also use special [story format](https://github.com/yhdgms1/novely/tree/main/packages/parser). No extra steps needed — it's already goes with [templates](/guide/getting-started#scaffolding-your-first-novely-project), all you need is to create a story file and import it:

```ts
import setupStory from './story.novely';

const story = setupStory(engine.action, {
  /**
   * JavaScript values goes here
   */
});

engine.script(story);
```

More on story format [here](/guide/story-format).