import type { Renderer, RendererInit, RendererStore, Character, ValidAction, CustomHandler, CustomHandlerGetResult } from '@novely/core'
import type { JSX } from 'solid-js';

import { Switch, Match } from 'solid-js';
import { createStore } from 'solid-js/store';

import { canvasDrawImages, createImage } from './utils';

import { Provider } from './context';

import { Game } from './screens/game';
import { MainMenu } from './screens/mainmenu';
import { Saves } from './screens/saves';
import { Settings } from './screens/settings';
import { Loading } from './screens/loading';

interface StateCharacter {
  /**
   * `element.className`
   */
  className: string;
  /**
   * `element.style`
   */
  style: string;
  /**
   * Показывать ли элемент
   */
  visible: boolean;
  /**
   * `id` для `setTimeout`, который отвечает за `duration` в `hideCharacter`
   */
  timeoutId: number;
}

interface StateDialog {
  /**
   * Контент диалога
   */
  content: string;
  /**
   * Мини-персонаж
   */
  character?: string;
  /**
   * Эмоция мини-персонажа
   */
  emotion?: string;
  /**
   * Должен ли диалог быть показан
   */
  visible: boolean;
  /**
   * Функция `resolve`
   */
  resolve?: () => void;
}

interface StateChoices {
  /**
   * Функция `resolve`
   * @param selected `index` выбранного
   */
  resolve?: (selected: number) => void;
  /**
   * Выборы
   */
  choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[];
  /**
   * Должен ли отображаться диалог
   */
  visible: boolean
}

interface StateInput {
  /**
   * Вопрос (что делает этот input)
   */
  question: string;
  /**
   * Элемент `input`
   */
  element?: HTMLInputElement;
  /**
   * Должен ли отображаться диалог с `input`
   */
  visible: boolean;
  /**
   * Функция `resolve`
   */
  resolve?: () => void
  /**
   * Ошибка
   */
  error: string;
}

interface StateText {
  /**
   * Текст
   */
  content: string,
  /**
   * Функция `resolve`
   */
  resolve?: () => void;
}

type StateLayers = Record<string, { value: CustomHandlerGetResult, fn: CustomHandler; clear: (() => void); dom: null | HTMLDivElement; } | undefined>;

interface State {
  background: string;
  characters: Record<string, StateCharacter>
  dialog: StateDialog
  choices: StateChoices
  input: StateInput
  layers: StateLayers;
  text: StateText;
  screen: "mainmenu" | "game" | "saves" | "settings" | 'loading'
}

interface SolidRendererStore extends RendererStore {
  dialogRef?: HTMLParagraphElement;
  textRef?: HTMLParagraphElement;
}

const createSolidRenderer = () => {
  const [state, setState] = createStore<State>({
    background: '',
    characters: {},
    dialog: {
      content: '',
      visible: false
    },
    choices: {
      visible: false,
      choices: []
    },
    input: {
      question: '',
      error: '',
      visible: false
    },
    text: {
      content: '',
    },
    layers: {},
    screen: 'mainmenu'
  });

  const store: SolidRendererStore = {
    characters: {},
    audio: {
      music: undefined
    }
  };

  let characters!: Record<string, Character>;
  let renderer!: Renderer;
  let options: RendererInit;

  let root!: HTMLElement;

  return {
    createRenderer(init: RendererInit): Renderer {
      options = init, characters = init.characters;

      return renderer = {
        background(background) {
          setState('background', background);
        },
        character(character) {
          if (store.characters[character]) return store.characters[character];

          const canvas = <canvas data-character={character} /> as HTMLCanvasElement;
          const ctx = canvas.getContext('2d')!;

          return store.characters[character] = {
            canvas,
            ctx,
            emotions: {},
            withEmotion(emotion) {
              const stored = store.characters[character].emotions[emotion];

              const render = (...images: HTMLImageElement[]) => {
                return () => {
                  canvasDrawImages(canvas, ctx, images);
                }
              }

              if (stored) return render(...('head' in stored ? [stored.head, stored.left, stored.right] : [stored]));

              const emotionData = characters[character].emotions[emotion];

              if (typeof emotionData === 'string') {
                return render(store.characters[character].emotions[emotion] = createImage(emotionData));
              }

              const head = createImage(emotionData.head);
              const left = createImage(emotionData.body.left);
              const right = createImage(emotionData.body.right);

              store.characters[character].emotions[emotion] = {
                head,
                left,
                right
              };

              return render(head, left, right);
            },
            append(className, style) {
              clearTimeout(state.characters[character]?.timeoutId);
              setState('characters', character, { className, style, visible: true })
            },
            remove(className, style, duration) {
              return (resolve) => {
                const timeoutId = setTimeout(() => {
                  setState('characters', character, { visible: false });
                  resolve();
                }, duration);

                setState('characters', character, { className, style, timeoutId })
              }
            }
          }
        },
        dialog(content, character, emotion) {
          return (resolve) => {
            setState('dialog', () => ({ content, character, emotion, visible: true, resolve }));
          }
        },
        choices(choices) {
          return (resolve) => {
            setState('choices', { choices, resolve, visible: true });
          }
        },
        clear(goingBack) {
          return (resolve) => {
            setState('background', '#000');
            setState('choices', { visible: false });
            setState('input', { element: undefined, question: '', visible: false });
            setState('dialog', { visible: false });

            for (const character of Object.keys(state.characters)) {
              setState('characters', character, { visible: false });
            }

            for (const [id, layer] of Object.entries(state.layers)) {
              if (!layer) continue;

              /**
               * Если происходит переход назад, и слой просит пропустить очистку при переходе назад, то не будем очищать слой
               */
              if (!(goingBack && layer.fn.skipClearOnGoingBack)) {
                layer.clear(), setState('layers', id, undefined);
              }
            }

            resolve();
          }
        },
        input(question, onInput, setup) {
          return (resolve) => {
            const errorHandler = (value: string) => {
              setState('input', { error: value });
            }

            const onInputHandler: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
              onInput({ input, event, error: errorHandler });
            };

            const input = <input type="text" name="novely-input" required autocomplete="off" onInput={onInputHandler} /> as HTMLInputElement;

            if (setup) setup(input);

            setState('input', { element: input, question, visible: true, resolve })
          }
        },
        music(source, method) {
          const stored = store.audio?.[method];

          if (stored && stored.element.src.endsWith(source)) return stored.element.currentTime = 0, stored;

          const element = new Audio(source);

          const handle = {
            element,
            pause: element.pause,
            play() {
              /**
               * Пользователь должен сначала взаимодействовать с документом
               */
              const onClick = () => {
                removeEventListener('click', onClick), element.play();
              }

              addEventListener('click', onClick);
            },
            stop() {
              element.pause();
              element.currentTime = 0;
            }
          };

          return store.audio[method] = handle;
        },
        custom(fn, goingBack, resolve) {
          const get: Parameters<CustomHandler>[0] = (id, insert = true) => {
            /**
             * Get `chched` value
             */
            const cached = state.layers[id];

            /**
             * Return it
             */
            if (cached) return cached.value;

            /**
             * `Clear` function
             */
            let clear = () => { };
            let store = {};

            /**
             * Function that call the `Clear` defined by the action itself, and then deletes the layer
             */
            const topLevelClear = () => {
              clear(), setState('layers', id, undefined);
            }

            /**
             * When no need to insert - just do not create it.
             */
            const element = insert ? <div id={id} /> as HTMLDivElement : null;

            setState('layers', id, {
              fn,
              dom: element,
              clear: topLevelClear,
              value: {
                root,
                element,
                delete: topLevelClear,
                data(data) {
                  return data ? (store = data) : store;
                },
                clear(cb) {
                  clear = cb;
                }
              }
            });

            return state.layers[id]!.value;
          };

          /**
           * Wait untill it is resolved
           */
          const result = fn(get, goingBack, fn.requireUserAction ? resolve : () => { });

          if (!fn.requireUserAction) result ? result.then(resolve) : resolve()

          return result;
        },
        text(content, resolve) {
          setState('text', { content, resolve });
        },
        store,
        ui: {
          showScreen(name) {
            setState('screen', name);
          }
        }
      }
    },
    Novely(props: Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'>) {
      return (
        <div {...props} ref={root as HTMLDivElement}>
          <Provider storeData={options.$} options={options} renderer={renderer}>
            <Switch fallback={<>No</>}>
              <Match when={state.screen === "game"}>
                <Game state={state} setState={/* @once */ setState} store={/* @once */ store} characters={/* @once */ characters} renderer={/* @once */ renderer} />
              </Match>
              <Match when={state.screen === 'mainmenu'}>
                <MainMenu setState={/* @once */ setState} />
              </Match>
              <Match when={state.screen === 'saves'}>
                <Saves setState={/* @once */ setState} />
              </Match>
              <Match when={state.screen === 'settings'}>
                <Settings setState={/* @once */ setState} />
              </Match>
              <Match when={state.screen === 'loading'}>
                <Loading />
              </Match>
            </Switch>
          </Provider>
        </div>
      )
    }
  }
}

export { createSolidRenderer }
export type { State, SolidRendererStore }