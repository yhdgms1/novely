import type { Renderer, Character as CharacterType } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import type { JSX } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { createEffect, createSignal, untrack, For, Show } from 'solid-js';
import { DialogName } from '../components/DialogName';
import { Character } from '../components/Character';
import { Modal } from '../components/Modal';

import { typewriter } from '@novely/typewriter'
import { useData } from '../context'
import { canvasDrawImages, url, isCSSImage } from '../utils'

interface GameProps {
  state: State;
  setState: SetStoreFunction<State>;

  store: SolidRendererStore;
  characters: Record<string, CharacterType>;
  renderer: Renderer;
}

const Game: VoidComponent<GameProps> = (props) => {
  const data = useData();
  /**
   * Могут быть деструктурированы
   */
  const { setState, characters, store, renderer } = props;

  let writer: ReturnType<typeof typewriter> | undefined;

  const background = () => {
    const is = isCSSImage(props.state.background)

    return { "background-image": is ? url(props.state.background) : '', "background-color": is ? undefined : props.state.background } as Partial<JSX.CSSProperties>
  };

  const [auto, setAuto] = createSignal(false);

  const getCurrentContent = (): readonly [element: HTMLElement | undefined, text: string] => {
    const state = props.state;

    if (state.dialog.content) {
      return [store.dialogRef, state.dialog.content]
    } else {
      return [store.textRef, state.text.content]
    }
  }

  createEffect(() => {
    const [element, text] = getCurrentContent();

    /**
     * Stop animation
     */
    writer?.destroy();

    /**
     * In case element is not present do not start the typewriter
     */
    if (!element) return;
    /**
     * When text is empty
     */
    if (!text) return;

    /**
     * Start new instance
     */
    writer = typewriter({
      node: element,
      text,
      ended() {
        /**
         * Ended without user interaction and `auto` mode is enabled
         */
        const next = untrack(auto);

        if (next) {
          untrack(clearTypewriterEffect);
        }
      },
      speed() {
        return data.storeData()!.meta[1]
      }
    });
  });

  const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
    if (disabled) return;

    const resolve = props.state.choices.resolve;

    setState('choices', { choices: [], visible: false, resolve: undefined, question: '' });
    resolve?.(i);
  }

  const clearTypewriterEffect = () => {
    if (writer && writer.end()) {
      const resolve = props.state.dialog.resolve || props.state.text.resolve;

      setState('dialog', { content: '', name: '', character: undefined, emotion: undefined, visible: false, resolve: undefined });
      setState('text', { content: '', resolve: undefined });

      resolve?.();
    }
  }

  const onInputButtonClick = () => {
    if (props.state.input.error || !props.state.input.element?.validity.valid) return;

    const resolve = props.state.input.resolve;

    setState('input', { element: undefined, question: '', visible: false });

    resolve?.();
  }

  const layers = () => Object.values(props.state.layers);

  return (
    <div class="root" style={background()}>
      <div data-characters={true} class="characters">
        <For each={Object.entries(props.state.characters)}>
          {([character, data]) => (
            <Show when={data.visible}>
              <Character
                character={character}
                data={data}
                characters={store.characters}
              />
            </Show>
          )}
        </For>
      </div>
      <div
        class="action-dialog"
        style={{ display: props.state.dialog.visible ? 'flex' : 'none' }}
        onClick={clearTypewriterEffect}
      >
        <DialogName
          character={props.state.dialog.character}
          name={props.state.dialog.name}
          characters={characters}
        />
        <div 
          class="action-dialog-container"
          data-no-person={!(props.state.dialog.character && props.state.dialog.emotion)}
        >
          <div class="action-dialog-person">
            <Show when={props.state.dialog.emotion} keyed>
              {(emotion) => {
                const character = props.state.dialog.character;

                /**
                 * Если персонажа нет
                 */
                if (!character) return null;

                /**
                 * Если эмоция ещё не загружена - загрузим её
                 */
                if (!store['characters'][character] || !store['characters'][character]['emotions'][emotion]) {
                  renderer.character(character).withEmotion(emotion)
                };

                const image = store['characters'][character]['emotions'][emotion];

                /**
                 * Если элемент - картинка, не будем выполнять лишнюю отрисовку на `canvas`
                 */
                if ('src' in image) return image;

                const [canvas] = canvasDrawImages(undefined, undefined, Object.values(image));

                return canvas;
              }}
            </Show>
          </div>
          <p class="action-dialog-content" ref={store.dialogRef}>
            &nbsp;
          </p>
        </div>
      </div>

      <Modal
        isOpen={() => props.state.choices.visible}
      >
        <div class="dialog-container">
          <span
            class="dialog-fix"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <div class="dialog-panel">
            <span
              class="dialog-panel-label"
              data-used={Boolean(props.state.choices.question)}
              aria-hidden={!props.state.choices.question}
            >
              {props.state.choices.question || <>ᅠ</>}
            </span>
            <For each={props.state.choices.choices}>
              {([text, _, active], i) => {
                const disabled = active ? !active() : false;
                const index = i();

                return (
                  <button
                    type="button"
                    class="button"
                    aria-disabled={disabled}
                    onClick={[onChoicesButtonClick, [disabled, index]]}
                  >
                    {text}
                  </button>
                )
              }}
            </For>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={() => props.state.input.visible}
      >
        <div class="dialog-container">
          <span
            class="dialog-fix"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <div class="dialog-panel input-dialog-panel">
            <label for="novely-input" class="input-dialog-label">
              <span>
                {props.state.input.question}
              </span>
              {props.state.input.element}
              <span aria-live="polite">
                {props.state.input.error}
              </span>
            </label>
            <button
              class="button dialog-input__button"
              onClick={onInputButtonClick}
              aria-disabled={Boolean(props.state.input.error || !props.state.input.element?.validity.valid)}
            >
              {data.t('Sumbit')}
            </button>
          </div>
        </div>
      </Modal>

      <div data-custom={true}>
        <For each={layers()}>
          {(value) => value!.dom}
        </For>
      </div>

      <div class="action-text" data-shown={Boolean(props.state.text.content)} ref={store.textRef} onClick={clearTypewriterEffect}>
        &nbsp;
      </div>

      <div class="control-panel">
        <button
          type="button"
          class="button control-panel__button"
          onClick={() => {
            data.options.stack.back();
            data.options.restore(data.options.stack.value);
          }}
        >
          {data.t('GoBack')}
        </button>
        <button
          type="button"
          class="button control-panel__button"
          onClick={() => {
            data.options.save(false, 'manual');
          }}
        >
          {data.t('DoSave')}
        </button>
        <button
          type="button"
          class="button control-panel__button"
          onClick={() => {
            setAuto(prev => !prev);
          }}
        >
          {data.t(auto() ? 'Stop' : 'Auto')}
        </button>
        <button
          type="button"
          class="button control-panel__button"
          onClick={() => {
            data.options.save(false, 'auto');
            props.setState('screen', 'settings');
          }}
        >
          {data.t('Settings')}
        </button>
        <button
          type="button"
          class="button control-panel__button"
          onClick={data.options.exit}
        >
          {data.t('Exit')}
        </button>
      </div>
    </div>
  )
}

export { Game }