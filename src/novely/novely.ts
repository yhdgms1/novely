import type { DefaultDefinedCharacter } from './character';
import type { ActionProxyProvider, Story, GetActionParameters } from './action';
import { Action } from './action'
import { capitalize } from './utils';
import { createRenderer } from './renderer';

interface NovelyInit {
  characters: Record<string, DefaultDefinedCharacter>;
}

const novely = <I extends NovelyInit>(init: I) => {
  let story: Story;
  let target: HTMLElement;

  const withStory = (s: Story) => {
    story = s;
  }

  const withTarget = (t: HTMLElement) => {
    target = t;
  }

  const action = new Proxy({} as ActionProxyProvider<I['characters']>, {
    get(_, prop) {
      return (...props: Parameters<ActionProxyProvider<I['characters']>[keyof ActionProxyProvider<I['characters']>]>) => {
        const type = capitalize(prop as string);
        const act = Action[type as keyof typeof Action];

        return [act, ...props];
      }
    }
  });

  const renderer = createRenderer(init.characters);

  const path: [Action | null, string | number][] = [];

  const next = async (key: string | number) => {

    if (path.length === 0) path.push([null, key], [null, 0]);

    const refer = (p = path) => {
      let c: any = story;

      for (const [type, val] of p) {
        if (type === null) {
          c = c[val];
        }
      }

      return c;
    }

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

    const referred = refer(path);

    if (!referred) return;

    const [action, ...props] = referred;

    console.dir(path)
    console.log(action, props)

    switch (action as unknown as Action) {
      case Action.ShowBackground: {
        const data = props as any as GetActionParameters<'ShowBackground'>;
        const background = data[0];

        renderer.background(target, background);
        next(arr_inc())

        break;
      }

      case Action.PlayMusic: {
        console.warn(`PlayMusic: cannot play ${props[0]} - не реализовано`);
        next(arr_inc())

        break;
      }

      case Action.ShowCharacter: {
        const data = props as any as GetActionParameters<'ShowCharacter'>;
        const [character, emotion, className, style] = data;

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
          target.appendChild(handle.canvas)
        };

        handle.withEmotion(emotion)();
        next(arr_inc())

        break;
      }

      case Action.HideCharacter: {
        const data = props as any as GetActionParameters<'HideCharacter'>;
        const [character, className, style, duration] = data;

        const handle = renderer.character(character);

        if (className) handle.canvas.classList.value = className;
        if (style) handle.canvas.style.cssText += style;

        setTimeout(() => {
          handle.canvas.parentElement?.removeChild(handle.canvas);

          next(arr_inc())
        }, duration);

        break;
      }

      case Action.Wait: {
        const data = props as any as GetActionParameters<'Wait'>;

        setTimeout(() => {
          next(arr_inc())
        }, data[0])

        break;
      }

      case Action.Dialog: {
        const data = props as any as GetActionParameters<'Dialog'>;
        const [person, content, emotion] = data;

        renderer.dialog(content, person, emotion)(target, () => {
          next(arr_inc());
        });

        break;
      }
    }
  }

  const setupStyling = (target: HTMLElement) => {
    target.parentElement!.style.height = '100vh';
    target.style.height = '100%';
    target.style.fontSize = '1em';
  }

  return {
    withStory,
    action,
    setupStyling,
    next,
    withTarget
  }
}

export { novely }
