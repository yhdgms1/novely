import type { Character } from './character';
import type { ActionProxyProvider, GetActionParameters, Story, ValidAction, DialogContent, ChoiceContent, CustomHandler } from './action';
import type { Storage } from './storage';
import type { Save, State, StorageData, DeepPartial } from './types'
import type { Renderer, RendererInit } from './renderer'
import type { SetupT9N } from '@novely/t9n'
import { matchAction, isNumber, isNull, isString, str, isUserRequiredAction, getDefaultSave, getLanguage, throttle } from './utils';
import { store } from './store';
import { all as deepmerge } from 'deepmerge'
import { klona } from 'klona/json';
import { SKIPPED_DURING_RESTORE } from './constants';
import { replace as replaceT9N } from '@novely/t9n';

interface NovelyInit<Languages extends string, Characters extends Record<string, Character<Languages>>, Inter extends ReturnType<SetupT9N<Languages>>, StateScheme extends State> {
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
   * An optional property that specifies whether the game should use a single save.
   */
  singleSave?: boolean;
  /**
   * Initial state value
   */
  state?: StateScheme;
}

const novely = <Languages extends string, Characters extends Record<string, Character<Languages>>, Inter extends ReturnType<SetupT9N<Languages>>, StateScheme extends State>({ characters, storage, renderer: createRenderer, initialScreen = "mainmenu", t9n, languages }: NovelyInit<Languages, Characters, Inter, StateScheme>) => {
  let story: Story;

  // @todo: find bug here
  const withStory = (s: Story) => {
    /**
     * Transforms `(ValidAction | ValidAction[])[]` to `ValidAction[]`
     */
    story = Object.fromEntries(Object.entries(s).map(([name, items]) => {
      const flat = (item: (ValidAction | ValidAction[])[]): ValidAction[] => {
        return item.flatMap((data) => {
          const type = data[0];

          /**
           * This is not just an action like `['name', ...arguments]`, but an array of actions
           */
          if (Array.isArray(type)) return flat(data as ValidAction[]);

          return [data as ValidAction];
        });
      };

      return [name, flat(items)];
    }));

    /**
     * When `initialScreen` is not a game, we can safely show it
     */
    if (initialScreen !== 'game') renderer.ui.showScreen(initialScreen);
  }

  const action = new Proxy({} as ActionProxyProvider<Characters>, {
    get(_, prop) {
      return (...props: Parameters<ActionProxyProvider<Record<string, Character>>[keyof ActionProxyProvider<Record<string, Character>>]>) => {
        return [prop, ...props];
      }
    }
  });

  function state(value: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): void;
  function state(): StateScheme;
  function state(value?: DeepPartial<StateScheme> | ((prev: StateScheme) => StateScheme)): StateScheme | void {
    if (!value) return stack.value[1] as StateScheme | void;

    const prev = stack.value[1];
    const val = typeof value === 'function' ? value(prev as StateScheme) : deepmerge([prev, value]);

    stack.value[1] = val as StateScheme;
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
        stack = [getDefaultSave()];
      }
    }
  }

  /**
   * 1) Novely rendered using the `initialData`, you can still start new game or `load` an empty one - this is scary, imagine losing your progress
   * 2) Actual stored data is loaded, language and etc is changed 
   */
  const initialData: StorageData = {
    saves: [],
    meta: [getLanguage(languages)]
  };

  const $ = store(initialData);

  let initialDataLoaded = false;

  const onStorageDataChange = (value: StorageData) => {
    if (initialDataLoaded) storage.set(value);
  };

  const throttledOnStorageDataChange = throttle(onStorageDataChange, 120);

  $.subscribe(throttledOnStorageDataChange);

  storage.get().then(stored => {
    /**
     * Default `localStorageStorage` cannot determine preferred language, and returns empty array
     */
    stored.meta[0] ||= getLanguage(languages);

    /**
     * Now the next store updates will entail saving via storage.set
     */
    initialDataLoaded = true;

    $.update(() => stored);

    /**
     * When initialScreen is game, then we will load it, but after the data is loaded
     */
    if (initialScreen === 'game') restore();
  });

  const initial = ((value) => value.saves.length > 0 && value.saves.at(-1))($.get()) || getDefaultSave();
  const stack = createStack(initial);

  const save = (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
    if (!initialDataLoaded) return;

    $.update(prev => {
      const date = stack.value[2][0];
      const isLatest = prev.saves.findIndex(value => value[2][0] === date) === prev.saves.length - 1;

      /**
       * Обновим дату и тип
       */
      stack.value[2][0] = Date.now();
      stack.value[2][1] = type;

      if (override) {
        /**
         * Перезапишем
         */
        if (isLatest) {
          /**
           * Сохранения хранятся в массиве. Нельзя перезаписать любое последнее
           * 
           * Если перезаписывать старое сохранение, то они не будут идти в хронологическом порядке
           */
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
      return prev;
    });
  }

  const newGame = () => {
    if (!initialDataLoaded) return;

    const save = getDefaultSave();

    $.update(prev => {
      prev.saves.push(save), restore(save);

      return prev;
    });
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
    if (!initialDataLoaded) return;

    let latest = save ? save : $.get().saves.at(-1);

    /**
     * Если нет сохранённой игры, то запустим ту, которая уже есть
     */
    if (!latest) {
      $.update(() => ({ saves: [initial], meta: [getLanguage(languages)] }));

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
        match(action as keyof ActionProxyProvider<Record<string, Character<string>>>, meta);
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
    set,
    restore,
    save,
    newGame,
    stack,
    languages,
    t: t9n.i,
    $
  });

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
      renderer.dialog(unwrap(content), person, emotion)(forward);
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
      try {
        navigator.vibrate(0)
      } finally {
        renderer.clear(goingBack)(push);
      }
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) stack.value[0].push(['condition', value], [null, 0]), render();
    },
    end() {
      /**
       * Save Current Game
       */
      save(false, 'auto');
      /**
       * Clear the Scene
       */
      match('clear', []);
      /**
       * Go to the main menu
       */
      renderer.ui.showScreen('mainmenu');
    },
    input([question, onInput, setup]) {
      renderer.input(question, onInput, setup)(forward);
    },
    custom([handler]) {
      const result = renderer.custom(handler, goingBack, () => {
        if (!restoring && handler.requireUserAction) enmemory();
        if (!restoring) push();
      });

      return result;
    },
    vibrate(pattern) {
      try {
        navigator.vibrate(pattern)
      } finally {
        push()
      }
    },
    next() {
      push();
    },
    animateCharacter([character, timeout, ...classes]) {
      const handler: CustomHandler = () => {
        const char = renderer.store.characters[character];

        /**
         * Character is not defined, maybe, `animateCharacter` was called before `showCharacter`
         */
        if (!char) return;

        const target = char.canvas;

        /**
         * Character is not found
         */
        if (!target) return;

        const classNames = classes.filter(className => !target.classList.contains(className));

        target.classList.add(...classNames);

        setTimeout(() => {
          target.classList.remove(...classNames);
        }, timeout);
      }

      handler.callOnlyLatest = true;

      return renderer.custom(handler, goingBack, () => { }), push();
    },
    text(text) {
      renderer.text(text.map(unwrap).join(' '), forward);
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

  const forward = () => {
    enmemory();
    push();
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
    const lang = $.get().meta[0];
    const data = state();

    return replaceT9N(typeof content === 'function' ? content(lang, data) : content, data);
  }

  return {
    withStory,
    action,
    render,
    state,
    t: t9n.t as Inter['t'],
  }
}

export { novely }
