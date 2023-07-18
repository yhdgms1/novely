import type { Character } from './character';
import type { ActionProxyProvider, GetActionParameters, Story, ValidAction, Unwrappable, CustomHandler } from './action';
import type { Storage } from './storage';
import type { Save, State, Data, StorageData, DeepPartial, NovelyScreen, Migration } from './types'
import type { Renderer, RendererInit } from './renderer'
import type { SetupT9N } from '@novely/t9n'
import { matchAction, isNumber, isNull, isString, isPromise, isEmpty, str, isUserRequiredAction, getTypewriterSpeed, getLanguage, throttle, isFunction, vibrate, findLastIndex } from './utils';
import { store } from './store';
import { all as deepmerge } from 'deepmerge'
import { klona } from 'klona/json';
import { SKIPPED_DURING_RESTORE, EMPTY_SET } from './constants';
import { replace as replaceT9N } from '@novely/t9n';

interface NovelyInit<Languages extends string, Characters extends Record<string, Character<Languages>>, Inter extends ReturnType<SetupT9N<Languages>>, StateScheme extends State, DataScheme extends Data> {
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
   * Delay loading data until Promise is resolved
   */
  storageDelay?: Promise<void>;
  /**
   * A function that returns a Renderer object used to display the game's content
   */
  renderer: (characters: RendererInit) => Renderer;
  /**
   * An optional property that specifies the initial screen to display when the game starts
   */
  initialScreen?: NovelyScreen;
  /**
   * An object containing the translation functions used in the game
   */
  t9n: Inter;
  /**
   * Initial state value
   */
  state?: StateScheme;
  /**
   * Initial data value
   */
  data?: DataScheme;
  /**
   * Enable autosaves or disable
   * @default true
   */
  autosaves?: boolean;
  /**
   * Migration from old saves to newer
   */
  migrations?: Migration[]
}

const novely = <
  Languages extends string,
  Characters extends Record<string, Character<Languages>>,
  Inter extends ReturnType<SetupT9N<Languages>>,
  StateScheme extends State,
  DataScheme extends Data
>({
  characters,
  storage,
  storageDelay = Promise.resolve(),
  renderer: createRenderer,
  initialScreen = "mainmenu",
  t9n,
  languages,
  state: defaultState,
  data: defaultData,
  autosaves = true,
  migrations = []
}: NovelyInit<Languages, Characters, Inter, StateScheme, DataScheme>) => {
  let story: Story;
  let times = new Set<number>();

  /**
   * Prevent `undefined`
   */
  defaultData ||= {} as DataScheme;
  defaultState ||= {} as StateScheme;

  /**
   * Saves timestamps created in this session
   */
  const intime = (value: number) => {
    return times.add(value), value;
  }

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
    const val = isFunction(value) ? value(prev as StateScheme) : deepmerge([prev, value]);

    stack.value[1] = val as StateScheme;
  }

  const getDefaultSave = (state = {}) => {
    return [[[null, 'start'], [null, 0]], state, [intime(Date.now()), 'auto']] as Save;
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
        stack = [getDefaultSave(klona(defaultState))];
      }
    }
  }

  /**
   * 1) Novely rendered using the `initialData`, but you can't start new game or `load` an empty one - this is scary, imagine losing your progress
   * 2) Actual stored data is loaded, language and etc is changed 
   */
  const initialData: StorageData = {
    saves: [],
    data: klona(defaultData) as Data,
    meta: [getLanguage(languages), getTypewriterSpeed()],
  };

  const $ = store(initialData);

  let initialDataLoaded = false;

  const onStorageDataChange = (value: StorageData) => {
    if (initialDataLoaded) storage.set(value);
  };

  const throttledOnStorageDataChange = throttle(onStorageDataChange, 120);

  $.subscribe(throttledOnStorageDataChange);

  const getStoredData = () => {
    storage.get().then(stored => {
      /**
       * Migration is done only once (when game loads it's data), and then it saves the updated format
       */
      for (const migration of migrations) {
        // @ts-expect-error Types does not match between versions
        stored = migration(stored);
      }

      /**
       * Default `localStorageStorage` cannot determine preferred language, and returns empty array
       */
      stored.meta[0] ||= getLanguage(languages);
      stored.meta[1] ||= getTypewriterSpeed();

      /**
       * When data is empty replace it with `defaultData`
       * It also might be empty (default to empty)
       */
      if (isEmpty(stored.data)) {
        stored.data = defaultData as Data;
      }

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
  }

  /**
   * By default this is resolved immediately, but also can be delayed.
   * I.e. storage has not loaded yet
   */
  storageDelay.then(getStoredData)

  const initial = getDefaultSave(klona(defaultState));
  const stack = createStack(initial);

  const save = (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
    if (!initialDataLoaded) return;

    /**
     * When autosaves diabled just return
     */
    if (!autosaves && type === 'auto') return;

    const current = klona(stack.value);

    $.update(prev => {
      /**
       * Find latest save that were created in current session, and check if it is latest in an array
       * 
       * We check if save was created in current session and it is latest in array
       * When it is not then replacing it will break logical chain
       * 
       * [auto save 1]
       * [manual save 1]
       * [auto save 2] <- should not replace first auto save 
       */
      const isLatest = findLastIndex(prev.saves, value => times.has(value[2][0])) === prev.saves.length - 1;

      /**
       * Update type and time information
       */
      current[2][0] = intime(Date.now());
      current[2][1] = type;

      if (!override || !isLatest) {
        prev.saves.push(current);

        return prev;
      }

      /**
       * Get latest
       */
      const latest = prev.saves.at(-1);

      /**
       * When that save is the same type, replace it
       */
      if (latest && latest[2][1] === type) {
        prev.saves[prev.saves.length - 1] = current;
      } else {
        prev.saves.push(current);
      }

      return prev;
    });
  }

  const newGame = () => {
    if (!initialDataLoaded) return;

    const save = getDefaultSave(klona(defaultState));

    /**
     * Initial save is automatic, and should be ignored when autosaves is turned off
     */
    if (autosaves) {
      $.update(prev => {
        return prev.saves.push(save), prev;
      });
    }

    restore(save);
  }

  /**
   * Set's the save
   */
  const set = (save: Save) => {
    stack.value = save;

    return restore(save);
  }

  let restoring = false;
  let goingBack = false;
  let interacted = false;

  /**
   * Restore
   */
  const restore = async (save?: Save) => {
    if (!initialDataLoaded) return;

    let latest = save ? save : $.get().saves.at(-1);

    /**
     * When there is no game, then make a new game
     */
    if (!latest) {
      $.update(() => ({ saves: [initial], data: klona(defaultData) as Data, meta: [getLanguage(languages), getTypewriterSpeed()] }));

      latest = klona(initial);
    }

    restoring = true, stack.value = latest;

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
    const keep = new Set();
    const characters = new Set();

    for (const [type, val] of stack.value[0]) {
      if (type === null) {
        if (isString(val)) {
          current = current[val];
        } else if (isNumber(val)) {
          index++;

          /**
           * Запустим все экшены которые идут в `[null, int]` от `0` до `int`
           * Почему-то потребовалось изменить `<` на `<=`, чтобы последний action попадал сюда
           */
          for (let i = 0; i <= val; i++) {
            const [action, ...meta] = current[i];

            /**
             * Add item to queue and action to keep
             */
            const push = () => {
              keep.add(action);
              queue.push([action, meta]);
            }

            /**
             * Do not remove characters that will be here anyways
             */
            if (action === 'showCharacter') characters.add(meta[0]);

            /**
             * Экшены, для закрытия которых пользователь должен с ними взаимодействовать
             * Также в эту группу входят экшены, которые не должны быть вызваны при восстановлении
             */
            if (SKIPPED_DURING_RESTORE.has(action) || isUserRequiredAction(action, meta)) {
              if (index === max && i === val) {
                push();
              } else {
                continue;
              }
            }

            push();
          }

          current = current[val];
        }
      } else if (type === 'choice') {
        current = current[val as number + 1][1];
      } else if (type === 'condition') {
        current = current[2][val];
      }
    }

    queue.forEach((value, index) => {
      /**
       * Mutate the queue item
       */
      value.push(index);
    });

    /**
     * This is basically made for TypeScript.
     */
    const indexedQueue = queue as unknown as [Exclude<ValidAction[0], ValidAction>, ValidAction[1], number][];

    /**
     * Run these exactly before the main loop.
     */
    renderer.ui.showScreen('game');
    /**
     * Provide the `keep` in there
     */
    match('clear', [keep, characters]);

    /**
     * Get the next actions array.
     */
    const next = (i: number) => indexedQueue.slice(i + 1);

    for await (const [action, meta, i] of indexedQueue) {
      if (action === 'function' || action === 'custom') {
        /**
         * When `callOnlyLatest` is `true`
         */
        if (action === 'custom' && (meta as GetActionParameters<'Custom'>)[0].callOnlyLatest) {
          /**
           * We'll calculate it is `latest` or not
           */
          const notLatest = next(i).some(([_action, _meta]) => {
            if (!_meta || !meta) return false;

            const c0 = _meta[0] as unknown as GetActionParameters<'Custom'>[0];
            const c1 =  meta[0] as unknown as GetActionParameters<'Custom'>[0];

            /**
             * Also check for `undefined`
             */
            const isIdenticalID = c0.id && c1.id && c0.id === c1.id;
            
            /**
             * Equal by id or equal by `toString()`
             */
            return isIdenticalID || (str(c0) === str(c1));
          });

          if (notLatest) continue;
        }

        /**
         * Action can return Promise. 
         */
        const result = match(action, meta);

        /**
         * Should wait until it resolved
         */
        if (isPromise(result)) {
          /**
           * Await it!
           */
          await result;
        }
      } else if (action === 'showCharacter') {
        const skip = next(i).some(([_action, _meta]) => {
          /**
           * Проверка на возможный `undefined`
           */
          if (!_meta || !meta) return false;

          /**
           * Будет ли персонаж скрыт в будущем
           * Нет смысла при загрузке сохранения загружать и отрисовывать персонажа, который будет скрыт
           */
          const hidden = _action === 'hideCharacter' && _meta[0] === meta[0];
          /**
           * Не нужно запускать рендер персонажа, если после этого будет ещё один рендер этого персонажа
           * Таким образом избегаем ситуации, когда при загрузке вследствие гонки при загрузки изображений отрисовывается не последняя эмоция
           */
          const notLatest = _action === action && _meta[0] === meta[0];

          return hidden || notLatest;
        })

        if (skip) continue;

        match(action, meta);
      } else if (action === 'showBackground' || action === 'animateCharacter') {
        /**
         * Такая же оптимизация применяется к фонам и анимированию персонажей.
         * Если фон изменится, то нет смысла устанавливать текущий
         */
        const notLatest = next(i).some(([_action]) => action === _action);

        if (notLatest) continue;

        match(action, meta);
      } else {
        match(action, meta);
      }
    }

    restoring = goingBack = false, render();
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

  const exit = () => {
    const current = stack.value;

    stack.clear();
    renderer.ui.showScreen('mainmenu');

    /**
     * First two save elements and it's type
     */
    const [[first, second], , [time, type]] = current;

    if (type === 'auto' && first && second) {
      /**
       * Если сохранение похоже на начальное, и при этом игрок не взаимодействовал с игрой, и оно было создано в текущей сессии, то удаляем его
       */
      if (first[0] === null && first[1] === 'start' && second[0] === null && !interacted && times.has(time)) {
        $.update((prev) => {
          prev.saves = prev.saves.filter(save => save !== current);

          return prev;
        })
      }
    }

    /**
     * Reset interactive value
     */
    interactivity(false);
    /**
     * Reset session times
     */
    times.clear();
  }

  const back = () => {
    return stack.back(), restore(stack.value);
  }

  const renderer = createRenderer({
    characters,
    set,
    restore,
    save,
    newGame,
    exit,
    back,
    stack,
    languages,
    t: t9n.i,
    $
  });

  const match = matchAction({
    wait([time]) {
      if (!restoring) setTimeout(push, isFunction(time) ? time() : time);
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

      handle.append(className, style, restoring);
      handle.withEmotion(emotion)();

      push()
    },
    hideCharacter([character, className, style, duration]) {
      renderer.character(character).remove(className, style, duration)(push, restoring);
    },
    dialog([character, content, emotion]) {
      /**
       * Person name
       */
      const name = (() => {
        const c = character, cs = characters;
        const lang = $.get().meta[0];

        return c ? c in cs ? typeof cs[c].name === 'string' ? cs[c].name as string : (cs[c].name as Record<string, string>)[lang] : c : '';
      })();

      renderer.dialog(unwrap(content), unwrap(name), character, emotion)(forward);
    },
    function([fn]) {
      const result = fn(restoring, goingBack);

      if (!restoring) result ? result.then(push) : push();

      return result;
    },
    choice([question, ...choices]) {
      const isWithoutQuestion = Array.isArray(question);

      if (isWithoutQuestion) {
        /**
         * Первый элемент может быть как строкой, так и элементов выбора
         */
        choices.unshift(question as unknown as [Unwrappable, ValidAction[], () => boolean]);
        /**
         * Значит, текст не требуется
         */
        question = '';
      }

      const unwrapped = choices.map(([content, action, visible]) => {
        return [unwrap(content), action, visible] as [string, ValidAction[], () => boolean];
      });

      renderer.choices(unwrap(question), unwrapped)((selected) => {
        enmemory();

        /**
         * If there is a question, then `index` should be shifted by `1`
         */
        const offset = isWithoutQuestion ? 0 : 1;

        stack.value[0].push(['choice', selected + offset], [null, 0]);
        render();
        interactivity(true);
      });
    },
    jump([scene]) {
      /**
       * `-1` index is used here because `clear` will run `next` that will increase index to `0`
       */
      stack.value[0] = [[null, scene], [null, -1]];

      match('clear', []);
    },
    clear([keep, characters]) {
      /**
       * Remove vibration
       */
      vibrate(0);
      /**
       * Call the actual `clear`
       */
      renderer.clear(goingBack, keep || EMPTY_SET, characters || EMPTY_SET)(push);
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) stack.value[0].push(['condition', String(value)], [null, 0]), render();
    },
    end() {
      /**
       * Clear the Scene
       */
      match('clear', []);
      /**
       * Go to the main menu
       */
      renderer.ui.showScreen('mainmenu');
      /**
       * Reset interactive value
       */
      interactivity(false);
      /**
       * Reset session times
       */
      times.clear();
    },
    input([question, onInput, setup]) {
      renderer.input(unwrap(question), onInput, setup)(forward);
    },
    custom([handler]) {
      const result = renderer.custom(handler, goingBack, () => {
        if (!restoring && handler.requireUserAction) enmemory(), interactivity(true);
        if (!restoring) push();
      });

      return result;
    },
    vibrate(pattern) {
      vibrate(pattern);
      push()
    },
    next() {
      push();
    },
    animateCharacter([character, timeout, ...classes]) {
      const handler: CustomHandler = (get) => {
        const { clear } = get('@@internal-animate-character', false);
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

        const timeoutId = setTimeout(() => {
          target.classList.remove(...classNames);
        }, timeout);

        clear(() => {
          target.classList.remove(...classNames);
          
          /**
           * Clear timeout, because when you will game re-runs some callback might remove classes from character
           */
          clearTimeout(timeoutId);
        });
      }

      /**
       * `callOnlyLatest` property will not have any effect, because `custom` is called directly
       */
      match('custom', [handler]);
    },
    text(text) {
      renderer.text(text.map((content) => unwrap(content)).join(' '), forward);
    },
    exit() {
      const path = stack.value[0];

      for (let i = path.length - 1; i > 0; i--) {
        if (path[i][0] !== 'choice' && path[i][0] !== 'condition') continue;

        stack.value[0] = path.slice(0, i);
        next();

        break;
      }

      render();
    }
  });

  const enmemory = () => {
    if (restoring) return;

    const current = klona(stack.value);

    current[2][1] = 'auto';

    stack.push(current);

    save(true, 'auto');
  }

  const next = () => {
    const path = stack.value[0];
    /**
     * Последний элемент пути
     */
    const last = path[path.length - 1]!;

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

    if (!Array.isArray(referred)) return;

    const [action, ...props] = referred;

    match(action, props);
  }

  const push = () => {
    if (!restoring) next(), render();
  }

  const forward = () => {
    enmemory();
    push();
    interactivity(true)
  }

  const interactivity = (value = false) => {
    interacted = value;
  }

  /**
   * Unwraps translatable content to string
   * 
   * @example ```
   * unwrap(t('Hello'));
   * unwrap({ en: 'Hello', ru: 'Привет' });
   * unwrap('Hello, {{name}}');
   * ```
   */
  const unwrap = (content: Unwrappable, global = false) => {
    const { data, meta: [lang] } = $.get();

    const obj = global ? data : state();
    const str = isFunction(content)
      ? content(lang, obj)
      : typeof content === 'object'
        ? content[lang]
        : content;
    
    return replaceT9N(str, obj);
  }

  function data(value: DeepPartial<DataScheme> | ((prev: DataScheme) => DataScheme)): void;
  function data(): DataScheme;
  function data(value?: DeepPartial<DataScheme> | ((prev: DataScheme) => DataScheme)): DataScheme | void {
    if (!value) return $.get().data as DataScheme | void;

    const prev = $.get().data;
    const val = isFunction(value) ? value(prev as DataScheme) : deepmerge([prev, value]);

    $.update((prev) => {
      prev.data = val;

      return prev;
    });
  }

  return {
    /**
     * Function to set story
     */
    withStory,
    /**
     * Function to get actions
     */
    action,
    /**
     * State that belongs to games
     */
    state,
    /**
     * Unlike `state`, stored at global scope instead and shared between games
     */
    data,
    /**
     * Unwraps translatable content to a string value
     */
    unwrap(content: Exclude<Unwrappable, Record<string, string>> | Record<Languages, string>) {
      return unwrap(content, true);
    },
    /**
     * Function that is used for translation
     */
    t: t9n.t as Inter['t'],
  }
}

export { novely }
