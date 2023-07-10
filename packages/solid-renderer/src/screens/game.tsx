import type { Renderer, Character as CharacterType } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import type { JSX } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { createEffect, createSignal, untrack, For, Show } from 'solid-js'
import { DialogName } from '../components/DialogName';
import { Character } from '../components/Character';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';

import { typewriter } from '@novely/typewriter'
import { useData } from '../context'
import { canvasDrawImages, url, isCSSImage } from '../utils'
import { TEXT_SPEED_MAP } from '../constants'

interface GameProps {
  state: State;
  setState: SetStoreFunction<State>;

  store: SolidRendererStore;
  characters: Record<string, CharacterType>;
  renderer: Renderer;
}

const PRM = matchMedia('(prefers-reduced-motion: reduce)');

const Game: VoidComponent<GameProps> = (props) => {
  const data = useData();

  /**
   * Can be destructured because these are passed without getters
   */
  const { setState, characters, store, renderer } = props;

  let writer: ReturnType<typeof typewriter> | undefined;
  /**
   * In example PRM was enabled, text was set, then PRM was disabled.
   * 
   * Is writer done? No.
   * Is PRM enabled? No.
   * 
   * This is used to overcome this situation.
   */
  let bypassedWriter = false;

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
     * When prefers-reduced-motion is enabled, then set the content immediately and completely
     */
    if (PRM.matches) {
      /**
       * Spaces replaces here for consistency
       */
      element.innerHTML = text.replace(/ /gm, '&#8197;');
      bypassedWriter = true;

      return;
    }

    bypassedWriter = false;

    const speed = data.storeData().meta[1];

    /**
     * Start new instance
     */
    writer = typewriter({
      node: element,
      text,
      ended() {
        /**
         * Ended without user interaction
         */
        const next = untrack(auto);

        /**
         * When `auto` mode is disabled
         */
        if (!next) return;

        if (PRM.matches) {
          setAuto(false);
        } else {
          untrack(clearTypewriterEffect)
        }
      },
      speed: TEXT_SPEED_MAP[speed]
    });
  });

  const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
    if (disabled) return;

    const resolve = props.state.choices.resolve;

    setState('choices', { choices: [], visible: false, resolve: undefined, question: '' });
    resolve?.(i);
  }

  const clearTypewriterEffect = () => {
    const reduced = PRM.matches;
    const written = writer && writer.end();

    if (reduced || written || bypassedWriter) {
      bypassedWriter = false;

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
          <p class="action-dialog-content" ref={store.dialogRef} />
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

      <div class="action-text" data-shown={Boolean(props.state.text.content)} onClick={clearTypewriterEffect}>
        <span ref={store.textRef} />
      </div>

      <div class="control-panel">
        <button
          type="button"
          class="button control-panel__button"
          title={data.t('GoBack')}
          onClick={data.options.back}
        >
          <span class="control-panel__button__content">
            {data.t('GoBack')}
          </span>
          <Icon class="control-panel__button__icon" children={Icon.Back()} />
        </button>
        <button
          type="button"
          class="button control-panel__button"
          title={data.t('DoSave')}
          onClick={() => {
            data.options.save(false, 'manual');
          }}
        >
          <span class="control-panel__button__content">
            {data.t('DoSave')}
          </span>
          <Icon class="control-panel__button__icon" children={Icon.Save()} />
        </button>
        <button
          type="button"
          class="button control-panel__button control-panel__button--auto-mode"
          title={data.t(auto() ? 'Stop' : 'Auto')}
          onClick={() => {
            setAuto(prev => !prev);
          }}
        >
          {data.t(auto() ? 'Stop' : 'Auto')}
        </button>
        <button
          type="button"
          class="button control-panel__button"
          title={data.t('Settings')}
          onClick={() => {
            data.options.save(false, 'auto');
            props.setState('screen', 'settings');
          }}
        >
          <span class="control-panel__button__content">
            {data.t('Settings')}
          </span>
          <Icon class="control-panel__button__icon" children={Icon.Settings()} />
        </button>
        <button
          type="button"
          class="button control-panel__button"
          title={data.t('Exit')}
          onClick={data.options.exit}
        >
          <span class="control-panel__button__content">
            {data.t('Exit')}
          </span>
          <Icon class="control-panel__button__icon" children={Icon.Exit()} />
        </button>
      </div>
    </div>
  )
}

export { Game }