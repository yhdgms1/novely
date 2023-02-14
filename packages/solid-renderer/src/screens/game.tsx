import type { Renderer, DefaultDefinedCharacter, } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import type { JSX } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { createEffect, createMemo, For, Show } from 'solid-js';
import { Dialog, DialogPanel } from 'solid-headless';

import { typewriter } from '@novely/typewriter'
import { canvasDrawImages, url, isCSSImage } from '../utils'

import { style } from '../styles/styles';

interface GameProps {
  state: State;
  setState: SetStoreFunction<State>;

  store: SolidRendererStore;
  characters: Record<string, DefaultDefinedCharacter>;
  renderer: Renderer;
}

const Game: VoidComponent<GameProps> = (props) => {
  /**
   * Могут быть деструктурированы
   */
  const { setState, characters, store, renderer } = props;

  let writer: ReturnType<typeof typewriter> | undefined;

  const background = createMemo(() => {
    const is = isCSSImage(props.state.background)

    return { "background-image": is ? url(props.state.background) : '', "background-color": is ? undefined : props.state.background } as Partial<JSX.CSSProperties>
  });

  createEffect(() => {
    if (props.state && store.dialogRef) {
      writer?.destroy();
      writer = typewriter(store.dialogRef, props.state.dialog.content);
    }
  });

  const onChoicesButtonClick = ([disabled, i]: [boolean, number]) => {
    if (disabled) return;

    const resolve = props.state.choices.resolve;

    setState('choices', { choices: [], visible: false, resolve: undefined });
    resolve?.(i);
  }

  const onDialogClick = () => {
    if (writer && writer.end()) {
      /**
       * Из-за рассинхронизации состояния `resolve` запускается после скрытия диалога
       */
      const resolve = props.state.dialog.resolve;

      setState('dialog', { content: '', character: undefined, emotion: undefined, visible: false, resolve: undefined });
      resolve?.();
    }
  }

  const onInputButtonClick = () => {
    if (props.state.input.error || !props.state.input.element?.validity.valid) return;

    const resolve = props.state.input.resolve;

    setState('input', { element: undefined, question: '', visible: false });

    resolve?.();
  }

  return (
    <div class={style.root} style={background()}>
      <div class={style.characters}>
        <For each={Object.entries(props.state.characters)}>
          {([character, data]) => (
            <Show when={data.visible}>
              {() => {
                const canvas = store.characters[character].canvas;

                /**
                 * При одинаковых значениях `className` или `style` не будет вызван ещё раз и анимация не будет перезапущена
                 */
                createEffect(() => {
                  void canvas.offsetWidth;

                  if (data.className) canvas.classList.value = data.className;
                  if (data.style) canvas.style.cssText = data.style;
                });

                return canvas
              }}
            </Show>
          )}
        </For>
      </div>
      <div
        class={style.dialog}
        style={{ display: props.state.dialog.visible ? 'flex' : 'none' }}
        onClick={onDialogClick}
      >
        <span
          class={style.dialogName}
          style={{
            color: props.state.dialog.character ? props.state.dialog.character in characters ? characters[props.state.dialog.character].color : '#000' : '#000',
            display: props.state.dialog.character ? 'block' : 'none'
          }}
        >
          {props.state.dialog.character ? props.state.dialog.character in characters ? characters[props.state.dialog.character].name : props.state.dialog.character : ''}
        </span>
        <div class={style.dialogContainer} data-no-person={!(props.state.dialog.character && props.state.dialog.emotion)}>
          <div class={style.dialogPerson}>
            <Show when={props.state.dialog.character && props.state.dialog.emotion}>
              {() => {
                const character = props.state.dialog.character!;
                const emotion = props.state.dialog.emotion!;

                /**
                 * Если эмоция ещё не загружена - загрузим её
                 */
                if (!store['characters'][character]) {
                  renderer.character(character).withEmotion(emotion)
                };

                const image = store['characters'][character]['emotions'][emotion];

                /**
                 * Если элемент - картинка, не будем выполнять лишнюю отрисовку на `canvas`
                 */
                if ('src' in image) return image.alt = '', image;

                const [canvas] = canvasDrawImages(undefined, undefined, Object.values(image));

                return canvas;
              }}
            </Show>
          </div>
          <p class={style.dialogText} ref={store.dialogRef}>
            &nbsp;
          </p>
        </div>
      </div>

      <Dialog
        isOpen={props.state.choices.visible}
        class={style.choices}
      >
        <div class={style.choicesContainer}>
          <span
            class={style.choicesF}
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel class={style.choicesDialogPanel}>
            <For each={props.state.choices.choices}>
              {([text, _, active], i) => {
                const disabled = active ? !active() : false;

                return (
                  <button
                    type="button"
                    aria-disabled={disabled}
                    onClick={[onChoicesButtonClick, [disabled, i()]]}
                  >
                    {text}
                  </button>
                )
              }}
            </For>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        isOpen={props.state.input.visible}
        class={style.input}
      >
        <div class={style.inputContainer}>
          <span
            class={style.inputF}
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel class={style.inputDialogPanel}>
            <label for="novely-input" class={style.inputLabel}>
              <span>
                {props.state.input.question}
              </span>
              {props.state.input.element}
              <span aria-live="polite">
                {props.state.input.error}
              </span>
            </label>
            <button
              onClick={onInputButtonClick}
              aria-disabled={(props.state.input.error || !props.state.input.element?.validity.valid) ? 'true' : 'false'}
            >
              Подтвердить
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

export { Game }