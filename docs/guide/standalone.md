# Standalone Package

Unlike of others, was built not for modules.

## Start

First of all, you should add the script to your `index.html`. It's recommended to pin the version or save file to the local folder so updates won't have a chance to hurt your game.

```html{2}
<body>
  <script src="https://cdn.jsdelivr.net/npm/@novely/standalone@latest"></script>
</body>
```

You'll get CSS Reset and Novely's styles out of the box. Now, you should configure it.

::: danger
You should not delete the assignments in the script. They are all used to start the engine.

Also, you should not change the sequence
:::

```html
<body>
  <script src="https://cdn.jsdelivr.net/npm/@novely/standalone@latest"></script>
  <script>
    // You can define a target where game will be mounted
    // By default this is `document.body` and you can ignore setting it
    // window.target = document.body;

    // Standalone package uses @novely/solid-renderer under the hood
    // These options are it's options
    window.rendererOptions = {};

    // Now you can access instance of @novely/solid-renderer
    window.solidRenderer;

    // Window contains all of available novely UI's translations. At the moment this is 'RU', 'EN', 'KK', and 'JP'
    // You can also declare your own translation string's for each language

    // Define options for the translation module:
    window.translation = {
      ru: {
        internal: window.RU,
        strings: {},
        pluralization: {}
      }
    };

    // This is novely core options. You must omit renderer and translation here.
    // Also, you can ignore setting 'storage'
    window.options = {
      languages: ['ru'],
      characters: {}
    };

    // Now you can access `window.novely`
    const { action, withStory } = window.novely;

    // Write you'r story here
    // Game will start only after this function will be ran
    withStory({
      start: [
        action.showBackground('black')
      ]
    })
  </script>
</body>
```