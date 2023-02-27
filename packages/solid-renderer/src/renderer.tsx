import type { Renderer, RendererInit, Storage, RendererStore, Character, ValidAction, CustomHandler, CustomHandlerGetResult, CustomHandlerGetResultDataFunction, CustomHandlerGetResultSkipClearOnGoingBackFunction, Stored, StorageData } from '@novely/core'
import type { JSX } from 'solid-js';

import { createEffect, Switch, Match, from } from 'solid-js';
import { createStore } from 'solid-js/store';

import { canvasDrawImages, createImage } from './utils'

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

type StateLayers = Record<string, CustomHandlerGetResult | undefined>;

interface State {
  background: string;
  characters: Record<string, StateCharacter>
  dialog: StateDialog
  choices: StateChoices
  input: StateInput
  layers: StateLayers;
  screen: "mainmenu" | "game" | "saves" | "settings" | 'loading'
}

interface SolidRendererStore extends RendererStore {
  dialogRef?: HTMLParagraphElement;
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
  let storage!: Storage;
  let set!: RendererInit['set']
  let restore!: RendererInit['restore'];
  let save!: RendererInit['save'];
  let stack!: RendererInit['stack'];
  let renderer!: Renderer;
  let languages!: string[];
  let t!: RendererInit['t'];
  let $!: Stored<StorageData>;

  return {
    createRenderer(init: RendererInit): Renderer {
      characters = init.characters, storage = init.storage, set = init.set, restore = init.restore, save = init.save, stack = init.stack, languages = init.languages, t = init.t, $ = init.$;

      return renderer = {
        background(background) {
          setState('background', background);
        },
        character(character) {
          if (store.characters[character]) return store.characters[character];

          const canvas = <canvas /> as HTMLCanvasElement;
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

            for (const layer of Object.values(state.layers)) {
              if (!layer) continue;

              /**
               * Если происходит переход назад, и слой просит пропустить очистку при переходе назад, то не будем очищать слой
               */
              if (!(goingBack && layer.skipClearOnGoingBack())) layer.delete();
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
          const get: Parameters<CustomHandler>[0] = (id) => {
            if (state.layers[id]) return state.layers[id]!;

            const local = {
              skipClearOnGoingBack: false,
              storage: {} as Record<string, unknown>,
              clear: () => { },
            }

            // @ts-expect-error - It should not
            const data = (data?: Record<string, unknown>) => {
              if (!data) {
                return local.storage;
              } else {
                local.storage = data;
              }
            }

            // @ts-expect-error - It should not
            const skipClearOnGoingBack = (value?: boolean) => {
              if (value) {
                local.skipClearOnGoingBack = value;
              } else {
                return local.skipClearOnGoingBack;
              }
            }

            setState('layers', id, () => ({
              element: <div id={id} /> as HTMLDivElement,
              data: data as CustomHandlerGetResultDataFunction,
              skipClearOnGoingBack: skipClearOnGoingBack as CustomHandlerGetResultSkipClearOnGoingBackFunction,
              clear(fn) {
                local.clear = fn;
              },
              delete() {
                local.clear();

                setState('layers', id, undefined);
              },
            }));

            return state.layers[id]!;
          };

          /**
           * Wait untill it is resolved
           */
          const result = fn(get, goingBack, fn.requireUserAction ? resolve : () => { });

          if (!fn.requireUserAction) result ? result.then(resolve) : resolve()

          return result;
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
      const storeData = from($);
      const update = $.update;

      createEffect(() => {
        console.log('wooohoo', storeData())
      });

      return (
        <div {...props}>
          <Switch fallback={<>No</>}>
            <Match when={state.screen === "game"}>
              <Game state={state} setState={/* @once */ setState} store={/* @once */ store} characters={/* @once */ characters} renderer={/* @once */ renderer} stack={/* @once */ stack} restore={/* @once */ restore} save={/* @once */ save} t={/* @once */ t} />
            </Match>
            <Match when={state.screen === 'mainmenu'}>
              <MainMenu setState={/* @once */ setState} storage={/* @once */ storage} restore={/* @once */ restore} t={/* @once */ t} />
            </Match>
            <Match when={state.screen === 'saves'}>
              <Saves setState={/* @once */ setState} storage={/* @once */ storage} set={/* @once */ set} t={/* @once */ t} />
            </Match>
            <Match when={state.screen === 'settings'}>
              <Settings setState={/* @once */ setState} storage={/* @once */ storage} languages={/* @once */ languages} restore={/* @once */ restore} stack={/* @once */ stack} t={/* @once */ t} />
            </Match>
            <Match when={state.screen === 'loading'}>
              <Loading />
            </Match>
          </Switch>
        </div>
      )
    }
  }
}

export { createSolidRenderer }
export type { State, SolidRendererStore }