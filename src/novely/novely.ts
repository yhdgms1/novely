import type { DefaultDefinedCharacter } from './character';
import type { ActionProxyProvider, Story } from './action';
import type { Storage } from './storage';
import type { Path } from './types'
import type { Renderer } from './dom-renderer/renderer'
import { matchAction, isNumber, isNull, isString } from './utils';

type Layout = any;

interface NovelyInit {
  target: HTMLElement;
  characters: Record<string, DefaultDefinedCharacter>;

  settings?: { assetsPreloading?: boolean }
  storage: Storage

  layout: (parent: HTMLElement) => Layout;
  renderer: (layout: Layout, parent: HTMLElement, characters: Record<string, DefaultDefinedCharacter>) => Renderer;
}

const novely = <I extends NovelyInit>(init: I) => {
  const target = init.target;

  let story: Story;

  const withStory = (s: Story) => {
    story = s;
  }

  const action = new Proxy({} as ActionProxyProvider<I['characters']>, {
    get(_, prop) {
      return (...props: Parameters<ActionProxyProvider<I['characters']>[keyof ActionProxyProvider<I['characters']>]>) => {
        return [prop, ...props];
      }
    }
  });

  const createStack = (current: [Path, {}], stack = [current]) => {
    let index = 0;

    return {
      /**
       * Возвращает текущее значение
       */
      get value() {
        return stack[index];
      },
      /**
       * Устанавливает текущее значение
       */
      set value(value: [Path, {}]) {
        stack[index] = value;
      },
      back() {
        index--;
        stack.length = index;
      },
      canBack() {
        return stack.length > 1 && index > 0;
      },
      push(value: [Path, {}]) {
        index++;
        stack[index] = value;
      }
    }
  }

  const stack = createStack([[[null, 'start'], [null, 0]], {}]);

  const save = async () => {
    await init.storage.set(path)
  }

  let restoring = false;

  const restore = async () => {
    const saved = await init.storage.get();

    /**
     * Если нет сохранённой игры, то запустим новую
     */
    if (!saved) return;

    restoring = true, path = saved;

    match('clear', []);

    /**
     * Текущий элемент в истории
     */
    let current: any = story;
    /**
     * Текущий элемент `[null, int]`
     */
    let index = 0;

    /**
     * Число элементов `[null, int]`
     */
    const max = path.reduce((acc, curr) => {
      if (isNull(curr[0]) && isNumber(curr[1])) {
        return acc + 1;
      }

      return acc + 0;
    }, 0);

    for await (const [type, val] of path) {
      if (type === null) {
        if (isString(val)) {
          current = current[val];
        } else if (isNumber(val)) {
          index++;

          /**
           * Запустим все экшены которые идут в `[null, int]` от `0` до `int`
           */
          for (let i = 0; i < val; i++) {
            const [action, ...meta] = current[i];

            /**
             * В будущем здесь будет больше таких элементов.
             * Диалог такой элемент, который должен быть закрыт пользователем для прохода дальше.
             */
            if (action === 'dialog') {
              if (index === max && i === val) {
                match(action, meta);
              } else {
                continue;
              }
            }

            if (action === 'function') {
              /**
               * `action.function` может возвращать Promise. Нужно подожать его `resolve`
               */
              const result: any = match(action, meta);

              if (result && 'then' in result) {
                await result;
              }
            } else {
              match(action, meta)
            }
          }

          current = current[val];
        }
      } else if (type === 'choice') {
        current = current[val as number + 1][1];
      } else if (type === 'condition') {
        current = current[2][val];
      }
    }

    restoring = false, render();
  }

  const refer = () => {
    let current: any = story;

    for (const [type, val] of path) {
      if (type === null) {
        current = current[val];
      } else if (type === 'choice') {
        current = current[val as number + 1][1];
      } else if (type === 'condition') {
        current = current[2][val];
      }
    }

    return current;
  }

  window.save = save;
  window.restore = restore;

  const layout = init.layout(target);
  const renderer = init.renderer(layout, target, init.characters);

  let path = stack.value[0];

  const match = matchAction({
    wait([time]) {
      /**
       * `restoring` может поменяться на `true` перед тем как запуститься `push` из `setTimeout`
       */
      if (!restoring) setTimeout(push, time);
    },
    showBackground([background]) {
      renderer.background(background);
      push()
    },
    playMusic([source]) {
      renderer.music(source, 'music').play();
      push()
    },
    stopMusic([source]) {
      renderer.music(source, 'music').stop();
      push()
    },
    showCharacter([character, emotion, className, style]) {
      const handle = renderer.character(character);

      handle.append(className, style);
      handle.withEmotion(emotion)();

      push()
    },
    hideCharacter([character, className, style, duration]) {
      const handle = renderer.character(character);

      handle.remove(className, style, duration)(push);
    },
    dialog([person, content, emotion]) {
      renderer.dialog(typeof content === 'function' ? content() : content, person, emotion)(push);
    },
    function([fn]) {
      const result = fn();

      if (!restoring) result ? result.then(push) : push();

      return result;
    },
    choice(choices) {
      renderer.choices(choices)((selected) => {
        path.push(['choice', selected], [null, 0]);
        render()
      });
    },
    jump([scene]) {
      path = [[null, scene], [null, 0]];

      renderer.clear()(() => {
        if (!restoring) render();
      })
    },
    clear() {
      renderer.clear()(push)
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) path.push(['condition', value], [null, 0]), render();
    },
    end() {
      // конец!!
    },
    input([question, onInput, setup]) {
      renderer.input(question, onInput, setup)(push);
    }
  });

  const next = () => {
    /**
     * Последний элемент пути
     */
    const last = path.at(-1)!;

    /**
     * Если он вида `[null, int]` - увеличивает `int`
     */
    if (isNull(last[0]) && isNumber(last[1])) {
      last[1] = last[1] + 1;
      return;
    }

    /**
     * Иначе добавляет новое `[null int]`
     */
    path.push([null, 0]);
  }

  const render = () => {
    const referred = refer();

    if (referred) {
      const [action, ...props] = referred;

      match(action, props);
    }
  }

  const push = () => {
    if (!restoring) next(), render();
  }

  const setupStyling = (target: HTMLElement) => {
    target.parentElement!.style.height = '100vh';
    target.style.height = '100%';
    target.style.fontSize = '1em';
    target.style.fontFamily = `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;

    target.style.backgroundRepeat = 'no-repeat';
    target.style.backgroundPosition = 'center';
    target.style.backgroundSize = 'cover';
  }

  setupStyling(target);

  return {
    withStory,
    action,
    render,
  }
}

export { novely }
