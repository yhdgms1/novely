import type { DefaultDefinedCharacter } from './character';
import type { ActionProxyProvider, Story } from './action';
import { matchAction } from './utils';
import { createRenderer } from './renderer';
import { createLayout } from './dom'

interface NovelyInit {
  target: HTMLElement;
  characters: Record<string, DefaultDefinedCharacter>;

  settings?: { assetsPreloading?: boolean }
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

  const store = () => {

  }

  const save = () => {
    localStorage.setItem('novely-', JSON.stringify(path));
  }

  let restoring = false;

  const restore = () => {
    let saved = localStorage.getItem('novely-');

    if (saved) {
      restoring = true;

      path = JSON.parse(saved);

      match('clear', []);

      console.log(path);

      let current: any = story;
      /**
       * Текущий элемент `[null, int]`
       */
      let index = 0;

      /**
       * Число элементов `[null, int]`
       */
      const max = path.reduce((acc, curr) => {
        if (curr[0] === null && typeof curr[1] === 'number') {
          return acc + 1;
        }

        return acc + 0;
      }, 0);

      console.log(max)

      for (const [type, val] of path) {
        console.log(type, val)
        if (type === null) {
          if (typeof val === 'string') {
            current = current[val];
          } else if (typeof val === 'number') {
            index++;

            for (let i = 0; i < val; i++) {
              const [action, ...meta] = current[i];

              if (action === 'dialog') {
                if (index === max && i === val) {
                  match(action, meta);
                } else {
                  continue;
                }
              }

              match(action, meta);
            }

            current = current[val];
          }
        } else if (type === 'choice') {
          current = current[val as number + 1][1];
        } else if (type === 'condition') {
          current = current[2][val];
        }
      }

      restoring = false;


      /**
       * path не начальный, а конечный
       * Нужено сделать функцию, которая из сохранённого path будет делать так, чтобы оно проходилось по всем элементам до него
       */

      next();
    }
  }

  window.save = save;
  window.restore = restore;

  const layout = createLayout(target);
  const renderer = createRenderer(layout, target, init.characters);

  let path: ['choice' | 'condition' | null, string | number][] = [[null, 'start'], [null, 0]];

  // @ts-ignore not implemented
  const match = matchAction({
    wait([time]) {

      setTimeout(() => {
        if (!restoring) arr_inc(), next();
      }, time);
    },
    showBackground([background]) {
      renderer.background(background);
      if (!restoring) arr_inc(), next();;
    },
    playMusic([source]) {
      renderer.music(source, 'music').play();

      if (!restoring) arr_inc(), next();
    },
    stopMusic([source]) {
      renderer.music(source, 'music').stop();

      if (!restoring) arr_inc(), next();
    },
    showCharacter([character, emotion, className, style]) {
      const handle = renderer.character(character);

      handle.append(className, style);
      handle.withEmotion(emotion)();

      if (!restoring) arr_inc(), next();
    },
    hideCharacter([character, className, style, duration]) {
      const handle = renderer.character(character);

      handle.remove(className, style, duration)(() => {
        if (!restoring) arr_inc(), next();
      });
    },
    dialog([person, content, emotion]) {
      renderer.dialog(content, person, emotion)(() => {
        if (!restoring) arr_inc(), next();;
      });
    },
    function([fn]) {
      const result = fn();

      // todo: придумать как ожидать эту функцию, если она асинхронная
      // todo: она может стейт ставит, или что-то инициализирует
      // todo: да в любом случае рассинхрон загрузки и работы

      if (!restoring) {
        if (result) {
          result.then(() => {
            arr_inc(), next();
          });
        } else {
          arr_inc(), next();
        }
      }

      return result;
    },
    choice(choices) {
      renderer.choices(choices)((selected) => {
        path.push(['choice', selected], [null, 0]);
        next()
      });
    },
    jump([scene]) {
      path = [[null, scene], [null, 0]];

      renderer.clear()(() => {
        if (!restoring) next(); // clear запустит next сам
      })
    },
    clear() {
      renderer.clear()(() => {
        if (!restoring) arr_inc(), next();
      })
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) path.push(['condition', value], [null, 0]), next();
    },
    end() {
      // конец!!
    },
    input([question, onInput, setup]) {
      renderer.input(question, onInput, setup)(() => {
        if (!restoring) arr_inc(), next();
      });
    }
  });

  const arr_inc = () => {
    const last = path.at(-1)!;

    if (last[0] === null && typeof last[1] === 'number') {
      last[1] = last[1] + 1;
      return last[1];
    } else {
      path.push([null, 0]);
      return 0;
    }
  }

  const refer = (p = path) => {
    let c: any = story;

    for (const [type, val] of p) {
      if (type === null) {
        c = c[val];
      } else if (type === 'choice') {
        c = c[val as number + 1][1];
      } else if (type === 'condition') {
        c = c[2][val];
      }
    }

    return c;
  }

  const next = () => {
    const referred = refer(path);

    if (!referred) return;

    const [action, ...props] = referred;

    console.dir(path)

    match(action, props);
  }

  const setupStyling = (target: HTMLElement) => {
    target.parentElement!.style.height = '100vh';
    target.style.height = '100%';
    target.style.fontSize = '1em';
    target.style.fontFamily = `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;
  }

  setupStyling(target);

  return {
    withStory,
    action,
    store,
    next,
  }
}

export { novely }
