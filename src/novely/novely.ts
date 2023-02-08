import type { DefaultDefinedCharacter } from './character';
import type { ActionProxyProvider, Story } from './action';
import { matchAction } from './utils';
import { createRenderer } from './renderer';
import { createCharactersRoot } from './dom'

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

  const charactersRoot = createCharactersRoot(target);

  const action = new Proxy({} as ActionProxyProvider<I['characters']>, {
    get(_, prop) {
      return (...props: Parameters<ActionProxyProvider<I['characters']>[keyof ActionProxyProvider<I['characters']>]>) => {
        return [prop, ...props];
      }
    }
  });

  const renderer = createRenderer(init.characters);

  let path: ['choice' | 'condition' | null, string | number][] = [];

  // @ts-ignore not implemented
  const match = matchAction({
    wait([time]) {
      setTimeout(next, time, arr_inc());
    },
    showBackground([background]) {
      renderer.background(target, background);
      next(arr_inc());
    },
    playMusic([audio]) {
      console.warn(`PlayMusic: cannot play ${audio} - не реализовано`);
      next(arr_inc())
    },
    showCharacter([character, emotion, className, style]) {
      const handle = renderer.character(character);

      handle.canvas.classList.value = '';

      if (className) {
        /**
         * A hack to restart CSS animations
         * @see https://css-tricks.com/restart-css-animation/#aa-update-another-javascript-method-to-restart-a-css-animation
         */
        void handle.canvas.offsetWidth;
        handle.canvas.classList.value = className || '';
      }

      handle.canvas.style.cssText += style;

      if (!handle.canvas.isConnected) {
        charactersRoot.appendChild(handle.canvas)
      };

      handle.withEmotion(emotion)();
      next(arr_inc())
    },
    hideCharacter([character, className, style, duration]) {
      const handle = renderer.character(character);

      if (className) handle.canvas.classList.value = className;
      if (style) handle.canvas.style.cssText += style;

      setTimeout(() => {
        handle.canvas.remove();

        next(arr_inc())
      }, duration);
    },
    dialog([person, content, emotion]) {
      renderer.dialog(content, person, emotion)(target, () => {
        next(arr_inc());
      });
    },
    function([fn]) {
      const result = fn();

      if (result) {
        result.then(() => {
          next(arr_inc())
        })
      } else {
        next(arr_inc())
      }
    },
    choice(choices) {
      renderer.choices(target, choices)((selected) => {
        path.push(['choice', selected], [null, 0]);
        next()
      });
    },
    jump([scene]) {
      path = [[null, scene], [null, 0]];
      next()
    },
    clear() {
      // todo: доделать
      next(arr_inc())
    },
    condition([condition]) {
      const value = condition();

      path.push(['condition', value], [null, 0])
      next();
    },
    end() {
      // конец!!
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

  const next = async (key?: string | number) => {

    if (path.length === 0) path.push([null, key!], [null, 0]);

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

      // console.log(path)

      return c;
    }

    const referred = refer(path);

    if (!referred) return;

    const [action, ...props] = referred;

    // console.dir(path)
    // console.log(action, props)

    match(action, props);
  }

  const setupStyling = (target: HTMLElement) => {
    target.parentElement!.style.height = '100vh';
    target.style.height = '100%';
    target.style.fontSize = '1em';
  }

  setupStyling(target);

  return {
    withStory,
    action,
    next,
  }
}

export { novely }
