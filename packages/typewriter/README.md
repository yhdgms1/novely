# @novely/typewriter

Простой эффект пишущей машинки. Может работать как с простыми строками, так и с HTML-разметкой.

## Использование

```ts title="main.ts"
import { typewriter } from "@novely/typewriter";

const writer = typewriter(
  document.body,
  "<em>Жить вечно не означает жить полной жизнью.</em> - <bold>Ольгерд Фон Эверик<bold/>"
);

buttonStop.onclick = () => {
  writer.end();
};

buttonFinish.onclick = () => {
  writer.destroy();
};
```

Функция `writer.end` при первом запуске, если текст ещё не был напечатан, моментально установит полный текст. При повторном запуске текст будет удалён.
