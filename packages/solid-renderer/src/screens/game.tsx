import type { Renderer, DefaultDefinedCharacter, RendererInit } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import type { JSX } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import { Dialog, DialogPanel } from 'solid-headless';

import { typewriter } from '@novely/typewriter'
import { canvasDrawImages, url, isCSSImage, join } from '../utils'

import { style } from '../styles/styles';

interface GameProps {
  state: State;
  setState: SetStoreFunction<State>;

  store: SolidRendererStore;
  characters: Record<string, DefaultDefinedCharacter>;
  renderer: Renderer;

  stack: RendererInit['stack'];
  restore: RendererInit['restore'];
  save: RendererInit['save'];
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

  const [auto, setAuto] = createSignal(false);

  createEffect(() => {
    if (props.state && store.dialogRef) {
      /**
       * Уничтожаем предыдущий инстанс
       */
      writer?.destroy();
      /**
       * Создаём новый инстанс
       */
      writer = typewriter(store.dialogRef, props.state.dialog.content, () => {
        if (auto()) onDialogClick();
      });
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
        <div class={join(style.dialogContainer, style.dialogContainerWithPerson)} data-no-person={!(props.state.dialog.character && props.state.dialog.emotion)}>
          <div class={style.dialogPerson}>
            <Show when={props.state.dialog.character && props.state.dialog.emotion}>
              {() => {
                const character = props.state.dialog.character!;
                const emotion = props.state.dialog.emotion!;

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
                if ('src' in image) return image.alt = '', image;

                const [canvas] = canvasDrawImages(undefined, undefined, Object.values(image));

                return canvas;
              }}
            </Show>
          </div>
          <p class={style.dialogContent} ref={store.dialogRef}>
            &nbsp;
          </p>
        </div>
      </div>

      <Dialog
        isOpen={props.state.choices.visible}
        class={style.headlessDialog}
      >
        <div class={style.headlessDialogContainer}>
          <span
            class={style.headlessDialogFix}
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel class={style.headlessDialogPanel}>
            <For each={props.state.choices.choices}>
              {([text, _, active], i) => {
                const disabled = active ? !active() : false;

                return (
                  <button
                    type="button"
                    aria-disabled={disabled}
                    class={join(style.button, style.buttonChoices)}
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
        class={style.headlessDialog}
      >
        <div class={style.headlessDialogContainer}>
          <span
            class={style.headlessDialogFix}
            aria-hidden="true"
          >
            &#8203;
          </span>
          <DialogPanel class={join(style.headlessDialogPanel, style.inputDialogPanel)}>
            <label for="novely-input" class={style.inputDialogLabel}>
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
              class={join(style.button, style.buttonInputDialogPanel)}
              aria-disabled={(props.state.input.error || !props.state.input.element?.validity.valid) ? 'true' : 'false'}
            >
              Подтвердить
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <div class={style.controlPanel}>
        <button
          type="button"
          onClick={() => {
            props.stack.back();
            props.restore(props.stack.value);
          }}
        >
          Назад
        </button>
        <button
          type="button"
          onClick={() => {
            props.save(false, 'manual');
          }}
        >
          Сохранение
        </button>
        <button
          type="button"
          onClick={() => {
            setAuto(prev => !prev);
          }}
        >
          Авто: {String(auto())}
        </button>
        <button
          type="button"
          onClick={() => {
            props.stack.clear();
            props.setState('screen', 'mainmenu');
          }}
        >
          Выход
        </button>
      </div>
    </div>
  )
}

export { Game }