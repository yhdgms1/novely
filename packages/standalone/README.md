# @novely/standalone

## Usage

```html
<!DOCTYPE html>
<html lang="en">
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
      en: {
        internal: window.EN,
        strings: {},
        pluralization: {}
      }
    };

    window.options = {
      languages: ['en'],
      characters: {}
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
