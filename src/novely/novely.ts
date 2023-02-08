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

  const layout = createLayout(target);
  const renderer = createRenderer(layout, target, init.characters);

  let path: ['choice' | 'condition' | null, string | number][] = [];

  // @ts-ignore not implemented
  const match = matchAction({
    wait([time]) {
      setTimeout(next, time, arr_inc());
    },
    showBackground([background]) {
      renderer.background(background);
      next(arr_inc());
    },
    playMusic([source]) {
      const audio = renderer.music(source, 'music');

      /**
       * user should interact with the document first
       */
      const onClick = () => {
        audio.play();
        removeEventListener('click', onClick);
      }

      addEventListener('click', onClick)

      next(arr_inc())
    },
    stopMusic([source]) {
      const audio = renderer.music(source, 'music');

      audio.pause();
      audio.currentTime = 0;

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
        layout[0].appendChild(handle.canvas)
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
      renderer.dialog(content, person, emotion)(() => {
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
      renderer.choices(choices)((selected) => {
        path.push(['choice', selected], [null, 0]);
        next()
      });
    },
    jump([scene]) {
      path = [[null, scene], [null, 0]];
      next()
    },
    clear() {
      const [charactersRoot, choicesRoot, dialogCollection] = layout;

      /**
       * Очистить персонажей
       */
      charactersRoot.childNodes.forEach(node => node.remove());

      /**
       * Очистить выбор
       */
      choicesRoot.childNodes.forEach(node => node.remove());
      choicesRoot.style.display = 'none';

      /**
       * Скрыть диалог
       */
      const [dialog, text, name, person] = dialogCollection;

      dialog.style.display = 'none';
      text.textContent = '';
      name.textContent = '';
      person.childNodes.forEach(node => node.remove());

      /**
       * Отключить все звуки
       */
      for (const audio of Object.values(renderer.store.audio)) {
        if (!audio) continue;

        audio.pause();
        audio.currentTime = 0;
      }

      /**
       * Перейти дальше
       */
      next(arr_inc())
    },
    condition([condition]) {
      const value = condition();

      path.push(['condition', value], [null, 0])
      next();
    },
    end() {
      // конец!!
    },
    input([question, onInput, setup]) {
      renderer.input(question, onInput, setup)(() => {
        next(arr_inc())
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
    target.style.fontFamily = `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;
  }

  setupStyling(target);

  return {
    withStory,
    action,
    next,
  }
}

export { novely }
