# Story Format

## Overview

Basically, you write story inside javascript or typescript files, you get smart completions, typechecking, etc... But also you have to write a lot of boilerplate code. Let's compare the short story written in JS and in our language:

JavaScript

```js
engine.withStory({
  start: [
    a.showBackground(room),
    a.showCharacter("Sister", "curious"),
    a.dialog("Sister", "Mum, he's still asleep!"),
    a.choice(
      "What would you do?",
      ["Wake up", [a.dialog("You", "Oh no!"), a.exit()]],
      [
        "Continue sleeping",
        [a.dialog("You", "Let me get some sleep"), a.exit()],
      ]
    ),
    a.condition(() => state().sister.angry, {
      true: [
        a.dialog(
          "Sister",
          "Are you out of your mind? We're going to be late because of you!"
        ),
        a.exit(),
      ],
      false: [a.dialog("Sister", "Wake up!"), a.exit()],
    }),
    a.end(),
  ],
});
```

Novely

```novely
start
  !showBackground %room
  !showCharacter Sister "curious"
  !dialog
    \Sister
    \Mum, he's still asleep!
  !choice
    \What would you do?
    =
      \Wake up
      =
        !dialog
          \You
          \Oh no!
        !exit
    =
      \Continue sleeping
      =
        !dialog
          \You
          \Let me get some sleep
        !exit
  !condition
    %() => $values1.state().sister.angry
    *
      true
        !dialog
          \Sister
          \
            Are you out of your mind?
            We're going to be late because of you!
        !exit
      false
        !dialog
          \Sister
          \Wake up!
        !exit
  !end
```

See it? No more parentheses, not so much quotes! Now let's look at it in more detail:

1. It is based on identation
2. Story keys does not need array literals
3. Actions start with `!`
4. Strings are wrapped in `""` or takes a new line and starts with `\`
5. JS Values are starts with `%`
6. Values from JS need to start with `$values1`, we'll see why later (however, it can be avoided)
7. Object is replaced with `*` and nested keys
8. Arrays replaced with `=`

## Why

The reason why that format is needed, at least to me, is that is does not have so much boilerplate as well as visually repetitive designs like parentheses, brackets, and colons.

Like

```js
export default {
  start: [a.showCharacter("Ciri", "smiley")],
};
```

And

```novely
start
  !showCharacter Ciri smiley
```

Type less!

## Details

When you import `.novely` file, the [plugin](https://github.com/yhdgms1/novely/tree/main/packages/vite-plugin-nvl) starts it's work, then the [parser](https://github.com/yhdgms1/novely/tree/main/packages/parser) parses the source, and transformer transforms it to JavaScript.

Internal story format is basically what do you see. When you use the `engine.action.some(prop1, prop2)` syntax, it just changes to `['some', prop1, prop2]`.

This custom format cannot be purely changed to `['some', prop]`, because `prop` is not accessible here. Instead, it returns a function. Take a look:

```js
export default ($values1) => ({
  start: [["some", $values1.prop]],
});
```

That way variables can be passed to the story. But not everything should be passed from some object. There are set of things that prevent use of `$values1`: When values starts from `undefined`, `null`, `window`, `globalThis`, or `()`, the raw value is used.

So,

```novely
start
  !function
    %() => $values1.state({ some: 'value' })
  !function
    %someFunction
  !function
    %setRelationshipPreference('None')
```

Will be transformed into

```js
export default ($values1) => ({
  start: [
    ["function", () => $values1.state({ some: "value" })],
    ["function", $values1.someFunction],
    ["function", $values1.setRelationshipPreference("None")],
  ],
});
```

And when you will run that, you will need to pass `state` and `someFunction`:

```js
import setupStory from "./story.novely";

const story = setupStory({
  state: engine.state,
  someFunction: () => {
    console.log("Do something here");
  },
  setRelationshipPreference: (target) => {
    /**
     * Make a closure that will update something
     */
    return () => {
      /**
       * Update relationships
       */
      state({ relationships: { target } });
    };
  },
});

engine.withStory(story);
```

## How to Avoid using `$values1`

You may consider `useWith` option. Find `novelyPlugin` in your configuration file and add `useWith: true` into that config.

Now code will be transformed into something like

```js{2,10}
export default ($values1) => {
  with ($values1) {
    return {
      start: [
        ['function', () => state({ some: 'value' })],
        ['function', someFunction],
        ['function', setRelationshipPreference('None')]
      ]
    }
  }
}
```

The [with](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with) statement is used here. This feature is not recommended to use, so it is disabled by default.
