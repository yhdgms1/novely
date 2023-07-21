# ShowBackground

Sets the background image or color

## Parameters

|    Name    |   Type   | Optional | Description |
| :--------: | :------: | :------: | :---------: |
| background | `string` |    ❌    | Background  |

## Usage

```ts
engine.withStory({
  start: [
    engine.action.showBackground("#f67288"),
    engine.action.showBackground("<url>"),
  ],
});
```
