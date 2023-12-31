# ShowBackground

Sets the background image or color

## Parameters

|    Name    |                     Type                      | Optional | Description |
| :--------: | :-------------------------------------------: | :------: | :---------: |
| background | <code>string \| Record<string, string></code> |    ❌    | Background  |

## Usage

```ts
engine.script({
  start: [
    engine.action.showBackground("#f67288"),
    engine.action.showBackground("<url>"),
    // latest matching is preferred
    engine.action.showBackground({
      all: "<url>",
      portrait: "<url>",
      "(prefers-color-scheme: dark)": "#363636",
    }),
  ],
});
```
