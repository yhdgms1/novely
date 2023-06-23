# novely-story-language-support

Highlights such content:

```nvl
start
  @action <value_from_js
  @action StringWithoutSpaces "String with spaces and \n line breaks"
  @action
    /This string can contain spaces
    /
      And that string can
      Even contain line breaks
      No more quotes!!
  @action
    <function_that_will_return_yes_or_no
    *
      yes
        @action "And it will be an object contining yes and no, and it's content will be inside of arrays"
      no
        @dialog "{ yes: [], no: [] }"
  @action 100
  @action
    1
    0
    0
    5
    0
    0
dojo
  @action "Another root"
```