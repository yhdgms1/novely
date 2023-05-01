import type { Renderer, Character as CharacterType } from '@novely/core'
import type { VoidComponent } from 'solid-js';
import type { JSX } from 'solid-js';
import type { SetStoreFunction } from 'solid-js/store'
import type { State, SolidRendererStore } from '../renderer'

import { createEffect, createSignal, For, Show } from 'solid-js';
import { DialogName } from '../components/DialogName';
import { Character } from '../components/Character';
import { Dialog, DialogPanel } from 'solid-headless';

import { typewriter } from '@novely/typewriter'
import { useData } from '../context'
import { canvasDrawImages, url, isCSSImage, join } from '../utils'

import { style } from '../styles/styles';

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

  const getCurrentContent = (): readonly [dialog: string, text: string] => {
    const state = props.state;

    return [state.dialog.content, state.text.content] as const;
  }

  createEffect(() => {
    const [dialog, text] = getCurrentContent();

    /**
     * Уничтожаем предыдущий инстанс
     */
    writer?.destroy();

    /**
     * Создаём новый инстанс
     */
    writer = typewriter(dialog ? store.dialogRef! : store.textRef!, dialog || text, () => {
      if (auto()) clearTypewriterEffect();
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
      /**
       * Из-за рассинхронизации состояния `resolve` запускается после скрытия диалога
       */
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
    <div class={style.root} style={background()}>
      <div data-characters={true} class={style.characters}>
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
        class={style.dialog}
        style={{ display: props.state.dialog.visible ? 'flex' : 'none' }}
        onClick={clearTypewriterEffect}
      >
        <DialogName
          character={props.state.dialog.character}
          name={props.state.dialog.name}
          characters={characters}
        />
        <div class={join(style.dialogContainer, style.dialogContainerWithPerson)} data-no-person={!(props.state.dialog.character && props.state.dialog.emotion)}>
          <div class={style.dialogPerson}>
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
            <p aria-hidden={!props.state.choices.question}>{props.state.choices.question || <>ᅠ</>}</p>
            <For each={props.state.choices.choices}>
              {([text, _, active], i) => {
                const disabled = active ? !active() : false;
                const index = i();

                return (
                  <button
                    type="button"
                    aria-disabled={disabled}
                    class={join(style.button, style.buttonChoices)}
                    onClick={[onChoicesButtonClick, [disabled, index]]}
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
              {data.t('Sumbit')}
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <div data-custom={true}>
        <For each={layers()}>
          {(value) => value!.dom}
        </For>
      </div>

      <div class={style.fullscreenText} data-fullscreen-text-shown={Boolean(props.state.text.content)} ref={store.textRef} onClick={clearTypewriterEffect}>
        &nbsp;
      </div>

      <div class={style.controlPanel}>
        <button
          type="button"
          class={join(style.button, style.buttonControlPanel)}
          onClick={() => {
            data.options.stack.back();
            data.options.restore(data.options.stack.value);
          }}
        >
          {data.t('GoBack')}
        </button>
        <button
          type="button"
          class={join(style.button, style.buttonControlPanel)}
          onClick={() => {
            data.options.save(false, 'manual');
          }}
        >
          {data.t('DoSave')}
        </button>
        <button
          type="button"
          class={join(style.button, style.buttonControlPanel)}
          onClick={() => {
            setAuto(prev => !prev);
          }}
        >
          {data.t(auto() ? 'Stop' : 'Auto')}
        </button>
        <button
          type="button"
          class={join(style.button, style.buttonControlPanel)}
          onClick={() => {
            data.options.save(false, 'auto');
            props.setState('screen', 'settings');
          }}
        >
          {data.t('Settings')}
        </button>
        <button
          type="button"
          class={join(style.button, style.buttonControlPanel)}
          onClick={() => {
            data.options.stack.clear();
            props.setState('screen', 'mainmenu');
          }}
        >
          {data.t('Exit')}
        </button>
      </div>
    </div>
  )
}

export { Game }