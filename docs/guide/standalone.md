# Standalone Package

Unlike of others, was built not for modules.

## Start

First of all, you should add the script to your `index.html`

```html{2}
<body>
  <script src="novely.js"></script>
</body>
```

You'll get CSS Reset and Novely's styles out of the box. Now, you should configure it.

::: danger
You should not delete the assignments in the script. They are all used to start the engine.
:::

```html
<body>
  <script src="novely.js"></script>
  <script>
    // Standalone package uses @novely/solid-renderer under the hood
    // These options are it's options
    window.rendererOptions = {};

    // Window contains all of available novely UI's translations. At the moment this is 'RU', 'EN', 'KK', and 'JP'
    // You can also declare your own translation string's for each language

    // Here translation module is created using options below:
    window.translation = {
      ru: {
        internal: window.RU,
        strings: {},
        pluralization: {}
      }
    };

    // This is novely core options. You must omit renderer and translation here.
    window.options = {
      languages: ['ru'],
      characters: {

      }
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