import type { Character } from './character';
import type { ActionProxyProvider, GetActionParameters, Story, ValidAction, DialogContent, ChoiceContent } from './action';
import type { Storage } from './storage';
import type { Save, State } from './types'
import type { Renderer, RendererInit } from './renderer'
import type { SetupT9N } from '@novely/t9n'
import { matchAction, isNumber, isNull, isString, isCSSImage, str, isUserRequiredAction, getLanguage } from './utils';
import { all as deepmerge } from 'deepmerge'
import { klona } from 'klona/json';
import { SKIPPED_DURING_RESTORE, getDefaultSave } from './constants';

interface NovelyInit<Languages extends string, Characters extends Record<string, Character<Languages>>, Inter extends ReturnType<SetupT9N<Languages>>> {
  /**
   * An array of languages supported by the game.
   */
  languages: Languages[];
  /**
   * An object containing the characters in the game.
   */
  characters: Characters;
  /**
   * An object that provides access to the game's storage system.
   */
  storage: Storage;
  /**
   * A function that returns a Renderer object used to display the game's content
   */
  renderer: (characters: RendererInit) => Renderer;
  /**
   * An optional property that specifies the initial screen to display when the game starts
   */
  initialScreen?: "mainmenu" | "game" | "saves" | "settings";
  /**
   * An object containing the translation functions used in the game
   */
  t9n: Inter;
  /**
   * An optional property that specifies whether to preload assets when the game starts
   */
  assetsPreload?: boolean;
  /**
   * An optional property that specifies whether the game should use a single save.
   */
  singleSave?: boolean;
}

type Novely = <Languages extends string, Characters extends Record<string, Character<Languages>>, Inter extends ReturnType<SetupT9N<Languages>>>(init: NovelyInit<Languages, Characters, Inter>) => {
  withStory: (s: Story) => void;
  action: ActionProxyProvider<Characters>;
  render: () => void;
  state: {
    (value: State | ((prev: State) => State)): void;
    (): State;
  };
  t: Inter['t'];
}

// @ts-ignore - Fuck ts
const novely: Novely = ({ characters, storage, renderer: createRenderer, initialScreen = "mainmenu", t9n, languages, assetsPreload }) => {
  let story: Story;

  const withStory = (s: Story) => {
    story = s;
    /**
     * Load assets after the `action` scripts are executed
     */
    preloadAssets();
  }

  /**
   * This is used when background is loading
   */
  const preload = {
    background: new Set<string>(),
  }

  const action = new Proxy({}, {
    get(_, prop) {
      return (...props: Parameters<ActionProxyProvider<Record<string, Character>>[keyof ActionProxyProvider<Record<string, Character>>]>) => {
        if (prop === 'showBackground') {
          if (isCSSImage(props[0] as string)) preload.background.add(props[0] as string);
        }

        return [prop, ...props];
      }
    }
  });

  function state(value: State | ((prev: State) => State)): void;
  function state(): State;
  function state(value?: State | ((prev: State) => State)): State | void {
    if (!value) return stack.value[1]

    const prev = stack.value[1];
    const val = typeof value === 'function' ? value(prev as State) : deepmerge([prev, value]);

    stack.value[1] = val as State;
  }

  const createStack = (current: Save, stack = [current]) => {
    return {
      get value() {
        return stack.at(-1)!;
      },
      set value(value: Save) {
        stack[stack.length - 1] = value;
      },
      back() {
        if (stack.length > 1) stack.pop(), goingBack = true;
      },
      push(value: Save) {
        stack.push(value);
      },
      clear() {
        stack = [getDefaultSave(languages, 'ru')];
      }
    }
  }

  // todo: load prev save
  const initial = getDefaultSave(languages);
  const stack = createStack(initial);

  const save = async (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
    /**
     * Получаем предыдущее значение
     */
    const prev = await storage.get();

    const date = stack.value[2][0];
    const isLatest = prev.saves.findIndex(value => value[2][0] === date) === prev.saves.length - 1;

    /**
     * Обновим дату
     */
    stack.value[2][0] = Date.now();
    stack.value[2][1] = type;

    if (override) {
      if (isLatest) {
        prev.saves[prev.saves.length - 1] = stack.value;
      } else {
        prev.saves.push(stack.value);
      }
    } else {
      /**
       * Добавляем текущее сохранение
       */
      prev.saves.push(stack.value);
    }

    /**
     * Устанавливаем новое значение
     */
    return await storage.set(prev);
  }

  /**
   * Устанавливает сохранение
   */
  const set = (save: Save) => {
    stack.value = save;

    return restore(save);
  }

  let restoring = false;
  let goingBack = false;

  /**
   * Визуально восстанавливает историю
   */
  const restore = async (save?: Save) => {
    // wat
    let latest = save ? save : await storage.get().then(value => value.saves.at(-1));

    /**
     * Если нет сохранённой игры, то запустим ту, которая уже есть
     */
    if (!latest) {
      await storage.set({ saves: [initial], meta: ['ru'] });

      latest = klona(initial);
    }

    restoring = true, stack.value = latest;

    /**
     * Показать экран игры
     */
    renderer.ui.showScreen('game');

    match('clear', [goingBack]);

    /**
     * Текущий элемент в истории
     */
    let current: any = story;
    /**
     * Текущий элемент `[null, int]`
     */
    let index = 0;

    console.log(stack.value)

    /**
     * Число элементов `[null, int]`
     */
    const max = stack.value[0].reduce((acc, [type, val]) => {
      if (isNull(type) && isNumber(val)) return acc + 1;

      return acc;
    }, 0);

    const queue = [] as [any, any][];

    for (const [type, val] of stack.value[0]) {
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
             * Экшены, для закрытия которых пользователь должен с ними взаимодействовать
             * Также в эту группу входят экшены, которые не должны быть вызваны при восстановлении
             */
            if (SKIPPED_DURING_RESTORE.has(action) || isUserRequiredAction(action, meta)) {
              if (index === max && i === val) {
                queue.push([action, meta]);
              } else {
                continue;
              }
            }

            queue.push([action, meta]);
          }

          current = current[val];
        }
      } else if (type === 'choice') {
        current = current[val as number + 1][1];
      } else if (type === 'condition') {
        current = current[2][val];
      }
    }

    const indexedQueue = queue.map((value, index) => value.concat(index) as [ValidAction[0], ValidAction[1], number]);

    for await (const [action, meta, i] of indexedQueue) {
      if (action === 'function' || action === 'custom') {
        /**
         * Если `callOnlyLatest` - `true`
         */
        if (action === 'custom' && (meta as GetActionParameters<'Custom'>)[0].callOnlyLatest) {
          /**
           * Вычислим `latest` или нет
           */
          const next = indexedQueue.slice(i + 1);
          const latest = !next.some(([_action, _meta]) => str(_meta[0]) === str(meta[0]));

          if (!latest) continue;
        }

        /**
         * Action может возвращать Promise. Нужно подожать его `resolve`
         */
        const result = match(action, meta);

        /**
         * Дождёмся окончания
         */
        if (result && 'then' in result) await result;
      } else {
        match(action, meta);
      }
    }

    restoring = false, goingBack = false, render();
  }

  const refer = () => {
    let current: any = story;

    for (const [type, val] of stack.value[0]) {
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

  const renderer = createRenderer({
    characters,
    storage,
    set,
    restore,
    save,
    stack,
    languages,
    t: (key) => t9n.i(key as any, 'ru'),
  });

  const preloadAssets = () => {
    if (!assetsPreload) return;

    /**
     * We need to load all the characters and their emotions
     */

    let promises: Promise<unknown>[] = [];

    renderer.ui.showScreen('loading');

    for (const [name, { emotions }] of Object.entries(characters)) {
      for (const emotion of Object.keys(emotions)) {
        promises.push(Promise.resolve(renderer.character(name).withEmotion(emotion)));
      }
    }

    for (const bg of preload.background) {
      promises.push(new Promise((res, rej) => {
        /**
         * Create `img` element
         */
        const img = document.createElement('img');

        /**
         * Set `src`
         */
        img.crossOrigin = '*';
        img.src = bg;

        if (img.complete && img.naturalHeight !== 0) {
          /**
           * Image is already loaded
           */
          res(void 0);
        } else {
          /**
           * Image is uniq, it is safe to use `onload`
           */
          img.onload = res;
          img.onerror = rej;
        }
      }));
    }

    if (!assetsPreload) {
      /**
       * Показывает экран
       */
      renderer.ui.showScreen(initialScreen);
    }

    Promise.all(promises).then(() => {
      renderer.ui.showScreen(initialScreen);
    });
  }

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
      renderer.dialog(unwrap(content), person, emotion)(() => {
        enmemory();
        push();
      });
    },
    function([fn]) {
      const result = fn();

      if (!restoring) result ? result.then(push) : push();

      return result;
    },
    choice(choices) {
      const unwrapped = choices.map(([content, action, visible]) => {
        return [unwrap(content), action, visible] as [string, ValidAction[], () => boolean];
      });

      renderer.choices(unwrapped)((selected) => {
        enmemory();

        stack.value[0].push(['choice', selected], [null, 0]), render();
      });
    },
    jump([scene]) {
      stack.value[0] = [[null, scene], [null, 0]];

      renderer.clear(false)(() => {
        if (!restoring) render();
      })
    },
    clear() {
      navigator.vibrate(0), renderer.clear(goingBack)(push);
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) stack.value[0].push(['condition', value], [null, 0]), render();
    },
    end() {
      save(false, 'auto').then(() => {
        match('clear', []);

        renderer.ui.showScreen('mainmenu');
      });
    },
    input([question, onInput, setup]) {
      renderer.input(question, onInput, setup)(() => {
        enmemory();
        push();
      });
    },
    custom([handler]) {
      const result = renderer.custom(handler, goingBack, () => {
        if (!restoring && handler.requireUserAction) enmemory();
        if (!restoring) push();
      });

      return result;
    },
    vibrate(pattern) {
      navigator.vibrate(pattern), push();
    },
    next() {
      push();
    }
  });

  const enmemory = () => {
    if (restoring) return;

    const current = klona(stack.value);

    current[0] = klona(stack.value[0]);

    current[2][0] = new Date().valueOf();
    current[2][1] = 'auto';

    stack.push(current);
  }

  const next = () => {
    /**
     * Последний элемент пути
     */
    const last = stack.value[0][stack.value[0].length - 1]!;

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
    stack.value[0].push([null, 0]);
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

  const unwrap = (content: DialogContent | ChoiceContent) => {
    return typeof content === 'function' ? content('ru', state()) : content
  }

  return {
    withStory,
    action,
    render,
    state,
    t: t9n.t,
  }
}

export { novely }
