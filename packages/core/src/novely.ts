import type { DefaultDefinedCharacter } from './character';
import type { ActionProxyProvider, Story } from './action';
import type { Storage } from './storage';
import type { Save, State } from './types'
import type { Renderer, RendererInit } from './renderer'
import { matchAction, isNumber, isNull, isString, createStack } from './utils';
import { all as deepmerge } from 'deepmerge'
import { default as templite } from 'templite'
import { klona } from 'klona/json';
import { DEFAULT_SAVE, USER_ACTION_REQUIRED_ACTIONS } from './constants'

interface NovelyInit {
  characters: Record<string, DefaultDefinedCharacter>;

  storage: Storage

  renderer: (characters: RendererInit) => Renderer;

  initialScreen?: "mainmenu" | "game" | "saves"
}

const novely = <I extends NovelyInit>({ characters, storage, renderer: createRenderer, initialScreen = "mainmenu", }: I) => {
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

  function state(value: State | ((prev: State) => State)): void;
  function state(): State;
  function state(value?: State | ((prev: State) => State)): State | void {
    if (!value) return stack.value[1]

    const prev = stack.value[1];
    const val = typeof value === 'function' ? value(prev as State) : deepmerge([prev, value]);

    stack.value[1] = val as State;
  }

  const initial = klona(DEFAULT_SAVE);
  const stack = createStack(initial);

  const save = async (override = false, type: Save[2][1] = override ? 'auto' : 'manual') => {
    /**
     * Получаем предыдущее значение
     */
    const prev = await storage.get();

    const date = stack.value[2][0];
    const isLatest = prev.findIndex(value => value[2][0] === date) === prev.length - 1;

    /**
     * Обновим дату
     */
    stack.value[2][0] = Date.now();
    stack.value[2][1] = type;

    if (override) {
      if (isLatest) {
        prev[prev.length - 1] = stack.value;
      } else {
        prev.push(stack.value);
      }
    } else {
      /**
       * Добавляем текущее сохранение
       */
      prev.push(stack.value);
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

  /**
   * Визуально восстанавливает историю
   */
  const restore = async (save?: Save) => {
    let latest = save ? save : await storage.get().then(value => value.at(-1));

    /**
     * Если нет сохранённой игры, то запустим ту, которая уже есть
     */
    if (!latest) {
      await storage.set([initial]);

      latest = klona(initial);
    }

    restoring = true, stack.value = latest;

    /**
     * Показать экран игры
     */
    renderer.ui.showScreen('game');

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
    const max = stack.value[0].reduce((acc, [type, val]) => {
      if (isNull(type) && isNumber(val)) return acc + 1;
      return acc;
    }, 0);

    for await (const [type, val] of stack.value[0]) {
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
             */
            if (USER_ACTION_REQUIRED_ACTIONS.has(action)) {
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
    stack
  });

  /**
   * Показывает экран
   */
  renderer.ui.showScreen(initialScreen);

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
      const value = typeof content === 'function' ? content(stack.value[2][2]) : content;
      const string = typeof value === 'string' ? value : value(state());

      renderer.dialog(templite(string, state()), person, emotion)(() => {
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
      renderer.choices(choices)((selected) => {
        enmemory();

        stack.value[0].push(['choice', selected], [null, 0]), render();
      });
    },
    jump([scene]) {
      stack.value[0] = [[null, scene], [null, 0]];

      renderer.clear()(() => {
        if (!restoring) render();
      })
    },
    clear() {
      renderer.clear()(push)
    },
    condition([condition]) {
      const value = condition();

      if (!restoring) stack.value[0].push(['condition', value], [null, 0]), render();
    },
    end() {
      // конец!!
    },
    input([question, onInput, setup]) {

      renderer.input(question, onInput, setup)(() => {
        enmemory();
        push();
      });
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

  return {
    withStory,
    action,
    render,
    state
  }
}

export { novely }
