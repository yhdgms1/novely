# Wait

Makes the game wait for a while before continuing

## Parameters

| Name |                Type                 | Optional |     Description      |
| :--: | :---------------------------------: | :------: | :------------------: |
| time | <code>number \| () => number</code> |    ❌    | Time in milliseconds |

## Usage

```ts
engine.withStory({
  start: [engine.action.wait(500), engine.action.wait(() => 100)],
});
```
