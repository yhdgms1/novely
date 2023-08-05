# @novely/standalone

## Использование

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <script src="novely.js"></script>
  <script>
    window.rendererOptions = {};
    window.translation = {
      ru: {
        internal: window.RU,
        strings: {},
        pluralization: {}
      }
    };

    window.options = {
      languages: ['ru'],
      characters: {

      }
    };

    const { action, withStory } = window.novely;

    withStory({
      start: [
        action.showBackground('black')
      ]
    })
  </script>
</body>
</html>
```
