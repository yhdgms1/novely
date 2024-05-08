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

			const { action, script } = window.engine;

			script({
				start: [action.showBackground('black')],
			});
		</script>
	</body>
</html>
```

## Information

Used @core version is 0.33.0 and @solid-renderer is 0.30.0
