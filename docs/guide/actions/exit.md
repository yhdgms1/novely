# Exit

Exit's branches inside of [Choice](/guide/actions/choice.md), [Condition](/guide/actions/condition.md), and [Block](/guide/actions/block.md).

::: warning
Novely does this automatically, so there's no need to exit action.
:::

## Example

Look at examples below to understand how `Exit` can be used

### Choice

```ts{12,19}
engine.withStory({
  start: [
    engine.action.choice(
      "What flavor do you like?",
      [
        "Cherry",
        [
          engine.action.dialog(
            "buddy",
            "Then I will buy you a cherry ice cream!"
          ),
          engine.action.exit(),
        ],
      ],
      [
        "Vanilla",
        [
          engine.action.dialog("buddy", "Vanilla ice cream! Got it!"),
          engine.action.exit(),
        ],
      ]
    ),
    engine.action.dialog("buddy", "Hello! Can I get uhh..."),
  ],
});
```

### Condition

```ts{8,12}
engine.withStory({
  start: [
    engine.action.condition(
      () => Math.random() >= 0.5 ? 'true' : 'false',
      {
        'true': [
          engine.action.dialog('baby', 'AAAAAAAAAAAAAAAAAAA')
          engine.action.exit(),
        ],
        'false': [
          engine.action.dialog('baby', '*Snores*'),
          engine.action.exit()
        ]
      }
    ),
    engine.action.text('Continue here 😼')
  ],
});
```

### Combined

```ts{15,23,27,31}
engine.withStory({
  start: [
    engine.action.condition(
      () => state().age >= 18 ? 'true' : 'false',
      {
        'true': [
          engine.action.dialog('cashier', 'Ok'),
          engine.action.choice(
            'Select Right PIN Code',
            [
              '1337',
              [
                engine.action.dialog('cashier', 'Incorrect.'),
                engine.action.dialog('you', 'Oh, damn. Then goodbye'),
                engine.action.exit(),
              ]
            ],
            [
              '1984',
              [
                engine.action.dialog('cashier', 'Have a nice day'),
                engine.action.dialog('you', 'You too, bye'),
                engine.action.exit()
              ]
            ]
          ),
          engine.action.exit(), // Note that first `exit` is inside choice, and then inside `condition`
        ],
        'false': [
          engine.action.dialog('cashier', 'Leave that store immediately!'),
          engine.action.exit()
        ]
      }
    )
  ],
});
```
