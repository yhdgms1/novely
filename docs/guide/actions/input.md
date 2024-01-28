# Input

Input Box

## Parameters

|   Name   |                                   Type                                   | Optional |             Description              |
| :------: | :----------------------------------------------------------------------: | :------: | :----------------------------------: |
| question |                                  string                                  |    ❌    |                What?                 |
| onInput  |                       `(meta: InputMeta) => void`                        |    ❌    | Called when typing from the keyboard |
|  setup   | `(input: HTMLInputElement, cleanup: (cb: (() => void)) => void) => void` |    ✔️    |     Helps you setup the `input`      |

```ts
interface InputMeta {
  /**
   * Input Element
   */
  input: HTMLInputElement;
  /**
   * Function to show error message or hide it
   * @param error Error message or empty string to remove it
   */
  error: (error: string) => void;
  /**
   * Input Event
   */
  event: InputEvent & { currentTarget: HTMLInputElement };
  /**
   * Sanitized `input.value`
   */
  value: string;
  /**
   * Game language
   */
  lang: string;
}
```

## Usage

```ts
engine.script({
  start: [
    action.input(
      "What's you'r name?",
      ({ input, error, event, value }) => {
        /**
         * Update error message or hide it
         */
        error(input.validationMessage);

        /**
         * Update state, using sanitized value here for security reasons
         */
        engine.state({ name: value });
      },
      (input) => {
        input.setAttribute("minlength", "2");
        input.setAttribute("maxlength", "16");
      }
    ),
    action.input(
      "Enter something",
      ({ error, value }) => {
        // Do something
      },
      (input, cleanup) => {
        const masked = new Maskito(input, {
          mask: ({ value }) => {
            const digitsCount = value.replace(/\D/g, "").length;

            return ["$", ...new Array(digitsCount || 1).fill(/\d/)];
          },
        });

        cleanup(() => {
          masked.destroy();
        });
      }
    ),
    action.input(
      "What's you'r name?",
      ({ input, error, event, value, lang }) => {
        /**
         * Update error message or hide it
         */
        error(lang === 'en' ? 'Some error' : '%4#@!!');

        /**
         * Update state, using sanitized value here for security reasons
         */
        engine.state({ name: value });
      },
      (input) => {
        input.setAttribute("minlength", "2");
        input.setAttribute("maxlength", "16");
      }
    ),
  ],
});
```
