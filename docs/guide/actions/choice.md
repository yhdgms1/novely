# Choice

Shows the choice display

## Parameters

|    Name    |                   Type                    | Optional |                                     Description                                      |
| :--------: | :---------------------------------------: | :------: | :----------------------------------------------------------------------------------: |
|  question  |         <code>TextContent</code>          |    ❌    |                     Question. String or object with translations                     |
| ...choices | <code>ActionChoiceExtendedChoice[]</code> |    ❌    | Title, children aka actions that runs when choice is selected, and other choice info |

## Usage

::: code-group

```ts [story.ts]
engine.script({
  start: [
    a.choice(
      "What would you say to Triss?",
      {
        title: "Goodbye, Triss",
        children: [a.function(() => console.log("Bye, Triss"))],
      },
      {
        title: "Stay with me",
        children: [a.function(() => console.log("Love with Triss"))],
      }
    ),
  ],
});
```

```ts [old-story.ts]
engine.script({
  start: [
    a.choice(
      "What would you say to Triss?",
      ["Goodbye, Triss", [a.function(() => console.log("Bye, Triss"))]],
      ["Stay with me", [a.function(() => console.log("Love with Triss"))]]
    ),
  ],
});
```

```novely [story.novely]
start
  !choice
  \What would you say to Triss?
  =
    \Goodbye, Triss
    =
      !function
        %() => conosle.log("Bye, Triss")
  =
    \Stay with me
    =
      !function
        %() => console.log("Love with Triss")
```

:::
