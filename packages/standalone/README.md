# @novely/standalone

## Usage

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>
	</head>
	<body>
		<script src="novely.js"></script>
		<script>
			window.rendererOptions = {};
			window.translation = {
				en: {
					internal: window.EN,
				},
			};

			window.options = {
				characters: {},
			};

			const { action, withStory } = window.novely;

			withStory({
				start: [action.showBackground('black')],
			});
		</script>
	</body>
</html>
```
