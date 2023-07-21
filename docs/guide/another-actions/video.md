# Video

Show's Video

## Installation

```bash
npm i @novely/video
```

## Parameters

|    Name    |      Type       | Optional |         Description         |
| :--------: | :-------------: | :------: | :-------------------------: |
| parameters | VideoParameters |    ❌    | Video Custom Action Options |

```tsx
declare interface VideoParameters {
  /**
   * Show video controls
   */
  controls?: boolean;
  /**
   * Close video automatically when it ended
   */
  close?: boolean;
  /**
   * Loop the video. Parameter `close` will be ignored
   */
  loop?: boolean;
  /**
   * Video URL
   */
  url: string;
}
```

## Usage

```ts
import { video } from "@novely/video";

engine.withStory({
  start: [
    engine.action.custom(
      video({
        url: "http://techslides.com/demos/sample-videos/small.mp4",
        controls: true,
      })
    ),
  ],
});
```
