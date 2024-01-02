# @novely/parser

Парсер для специального языка визуальных новелл

## Использование

```ts
import { parse, transform } from '!novely/parser';

const ast = parse(source);
const js = transform(ast);

const fn = eval(js);

const story = fn(engine.action, {});
```

## Для чего

Написание историй на js/ts может показаться удобным ввиду типизации. Тем не менее, синтаксис js не является удобным для такого рода деятельности. Достаточно удобным вариантом, хоть и не очень популярным, может оказаться собственный формат. Поскольку истории в Novely не привязаны к какой-либо сложной системе это реализуется достаточно легко. В чём же отличия формата?

В этом формате структура зависит от количества отступов. Это позволяет добиться более лёгкого прочтения.

Ключи основных сцен пишутся в начале строки

```nvl
start
dojo
```

В js ключи могут писаться где угодно, тем не менее это будет минимум один или два отступа

```js
engine.withStory({
	start: [],
	dojo: [],
});

loaded.then(() => {
	engine.withStory({
		start: [],
		dojo: [],
	});
});
```

Экшены описываются через ! и название экшена. После чего или на текущей строки или на следующих находятся параметры.

```nvl
start
  !dialog Name "Тут можно написать текст\n Добавить перенос"
  !dialog
    \Name
    \
      А можно написать текст таким образом
      Без кавычек
```

В js такая запись эквивалента следующей:

```js
engine.withStory({
	start: [
		a.dialog('Name', 'Тут можно написать текст\n Добавить перенос'),
		a.dialog(
			'Name',
			`
А можно написать текст таким образом
Без кавычек`,
		),
	],
});
```

Значения из js передаются через спец-символ %.

```nvl
start
  !dialog %Person %Text
```

В js это проще:

```js
engine.withStory({
	start: [a.dialog(Person, Text)],
});
```

Запись экшена условия, для которого требуется объект, также отличается

```nvl
start
  !condition
    %jsCondition
    *
      jail
        !dialog Мент "От судьбы не убежишь"
      freedom
        !dialog Кент "Ты убежал, но в этот раз тебе просто повезло"
```

В js:

```js
engine.withStory({
	start: [
		a.condition(jsCondition, {
			jail: [a.dialog('Мент', 'От судьбы не убежишь')],
			freedom: [a.dialog('Кент', 'Ты убежал, но в этот раз тебе просто повезло')],
		}),
	],
});
```

Отличия не настолько большие, чтобы реализовывать отдельный язык, тем не менее я думаю мне может быть более удобна разметка с использованием языка историй Novely.