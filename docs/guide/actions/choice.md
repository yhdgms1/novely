# Choice

Shows the choice display

## Parameters

|    Name     |                            Type                             | Optional |                                      Description                                      |
| :---------: | :---------------------------------------------------------: | :------: | :-----------------------------------------------------------------------------------: |
| question |                    <code>string?</code>                     |    ✔️    |                           Question, this is optional option                           |
| ...choices  | <code>([[string, ValidAction[], (() => boolean)?])[]</code> |    ❌    | Selection text, Actions, and a function that determines the availability of an option |

## Usage

```ts
engine.script({
  start: [
    action.choice(
      // 'What would you say to Triss?',
      [
        "Goodbye, Triss",
        [
          action.action(parameters),
          action.action(parameters),
          action.action(parameters),
        ],
      ],
      [
        "Stay with me",
        [
          action.action(parameters),
          action.action(parameters),
          action.action(parameters),
        ],
        () => {
          /**
           * This is not available option, true – available
           */
          return false;
        },
      ]
    ),
  ],
});
```
