# Voice

Plays the voice. It does not loop. When one voice plays previous voice stops playing.

## Parameters

| Name  |                    Type                     | Optional |  Description   |
| :---: | :-----------------------------------------: | :------: | :------------: |
| audio | `string \| Partial<Record<string, string>>` |    ❌    | Audio resource |

## Usage

```ts
engine.script({
  start: [
    action.voice("./assets/hello.mp3"),
    // in case lots of languages supported
    action.voice({
      ua: "./assets/hello_ua.mp3",
      en: "./assets/hello_en.mp3",
    }),
  ],
});
```

If you will not pass language into the voice using object it will just not play. If you will pass a string it will play for all languages.
