# Condition

Condition, based on the result of the function

## Parameters

|   Name    |            Type            | Optional |                  Description                   |
| :-------: | :------------------------: | :------: | :--------------------------------------------: |
| condition |         `() => T`          |    ❌    | The function that defines the narrative branch |
| variants  | `Record<T, ValidAction[]>` |    ❌    |               Narrative Branches               |

## Usage

```ts
engine.withStory({
  start: [
    engine.action.condition(
      () => {
        return engine.state().age >= 18 ? "yes" : "no";
      },
      {
        yes: [action.dialog(undefined, "Let me show you a unicorn")],
        no: [action.dialog(undefined, "You're young...")],
      }
    ),
  ],
});
```
