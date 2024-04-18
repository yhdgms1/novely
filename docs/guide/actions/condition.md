# Condition

Condition, based on the result of the function

## Parameters

|   Name    |            Type            | Optional |                  Description                   |
| :-------: | :------------------------: | :------: | :--------------------------------------------: |
| condition |   `(state: State) => T`    |    ❌    | The function that defines the narrative branch |
| variants  | `Record<T, ValidAction[]>` |    ❌    |               Narrative Branches               |

## Usage

```ts
engine.script({
  start: [
    engine.action.condition(
      (state) => {
        return state.age >= 18 ? "yes" : "no";
      },
      {
        yes: [action.dialog(undefined, "Let me show you an unicorn!")],
        no: [action.dialog(undefined, "You're too young kid")],
      }
    ),
  ],
});
```
