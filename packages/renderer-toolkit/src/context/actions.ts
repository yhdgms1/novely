import type {
  BackgroundImage,
  Context,
  DefaultActionProxy,
  RendererInit,
  CustomHandler,
  State,
  ActionInputOnInputMeta,
	ActionInputSetup,
  CustomHandlerFunctionGetFn
} from '@novely/core'
import type { ContextState, ContextStateStore } from '../state/context-state'
import type { RendererStateStore } from '../state/renderer-state'
import type { DeepMapStore } from 'nanostores'

import { vibrate } from './vibrate'
import { useBackground } from './background'
import { escapeHTML } from '../utils'
import { mutateAtom } from '../atoms/mutate-atom'

const handleBackgroundAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, background: string | BackgroundImage) => {
  const { clear } = $contextState.get().background;

  clear && clear();

  if (typeof background === 'string') {
    mutateAtom(
      $contextState,
      (state) => state.background.background,
      background
    );

    return;
  }

  const { dispose } = useBackground(background, (value) => {
    mutateAtom(
      $contextState,
      (state) => state.background.background,
      value
    );
  })

  mutateAtom(
    $contextState,
    (state) => state.background.clear,
    () => dispose
  );
}

const handleDialogAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, content: string, name: string, character: string | undefined, emotion: string | undefined, resolve: () => void) => {
  mutateAtom(
    $contextState,
    (state) => state.dialog,
    {
      content,
      name,
      miniature: {
        character,
        emotion,
      },
      visible: true,
      resolve,
    }
  )
}

const handleChoiceAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, label: string, choices: [name: string, active: boolean][], resolve: (selected: number) => void) => {
  mutateAtom(
    $contextState,
    (state) => state.choice,
    { choices, label, resolve, visible: true }
  )
}

const handleClearAction = ($rendererState: DeepMapStore<RendererStateStore<Record<PropertyKey, unknown>>>, $contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, context: Context, keep: Set<keyof DefaultActionProxy>, keepCharacters: Set<string>) => {
  mutateAtom($rendererState, (state) => state.exitPromptShown, false);

  if (!keep.has('showBackground')) {
    mutateAtom(
      $contextState,
      (state) => state.background.background,
      '#000'
    );
  }

  if (!keep.has('choice')) {
    mutateAtom(
      $contextState,
      (state) => state.choice,
      {
        choices: [],
        visible: false,
        label: '',
      }
    )
  }

  if (!keep.has('input')) {
    mutateAtom(
      $contextState,
      (state) => state.input,
      {
        element: null,
        label: '',
        visible: false,
        error: '',
      }
    );
  }

  if (!keep.has('dialog')) {
    mutateAtom(
      $contextState,
      (state) => state.dialog,
      { visible: false, content: '', name: '', miniature: {} }
    );
  }

  if (!keep.has('text')) {
    mutateAtom(
      $contextState,
      (state) => state.text,
      { content: '' }
    );
  }

  const { characters, custom } = $contextState.get() as ContextState;

  for (const character of Object.keys(characters)) {
    if (!keepCharacters.has(character)) {
      mutateAtom(
        $contextState,
        (state) => state.characters[character],
        {
          style: undefined,
          visible: false,
        }
      );
    }
  }

  for (const [id, handler] of Object.entries(custom)) {
    if (!handler) continue;
    if (context.meta.goingBack && handler.fn.skipClearOnGoingBack) continue;

    handler.clear();
    mutateAtom(
      $contextState,
      (state) => state.custom[id],
      undefined
    );
  }
}

/**
 * You MUST return value returned by this function
 */
const handleCustomAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, options: RendererInit, context: Context, fn: CustomHandler<string, State>, resolve: () => void) => {
  const get = (insert = true) => {
    const cached = $contextState.get().custom[fn.key]

    if (cached) {
      return cached.getReturn
    }

    /**
     * `Clear` function
     */
    let clear = () => {};
    let store = {};

    /**
     * Function that call the `Clear` defined by the action itself, and then deletes the layer
     */
    const clearManager = () => {
      clear();
      mutateAtom(
        $contextState,
        (state) => state.custom[fn.key],
        undefined
      );
    };

    const createElement = () => {
      const div = document.createElement('div');

      div.setAttribute('data-id', fn.key);

      return div;
    }

    const element = insert ? createElement() : null;

    const getReturn = {
      root: context.root,
      element,
      delete: clearManager,
      data(data: any) {
        return data ? (store = data) : store;
      },
      clear(cb: () => void) {
        clear = cb;
      },
    }

    mutateAtom(
      $contextState,
      (state) => state.custom[fn.key],
      {
        dom: element,
        fn,
        getReturn,

        clear: clearManager,
      }
    );

    return getReturn
  };

  const result = fn({
    get: get as CustomHandlerFunctionGetFn,

    goingBack: context.meta.goingBack,
    preview: context.meta.preview,

    lang: options.storageData.get().meta[0],

    state: options.getStateFunction(context.id)
  });

  result ? result.then(resolve) : resolve();

  return result;
}

const handleClearCustomAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, fn: CustomHandler<string, State>) => {
  const data = $contextState.get().custom[fn.key];

  if (data) data.clear();
}

const handleTextAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, content: string, resolve: () => void) => {
  mutateAtom(
    $contextState,
    (state) => state.text,
    { content, resolve }
  );
}

const handleInputAction = ($contextState: DeepMapStore<ContextStateStore<Record<PropertyKey, unknown>>>, options: RendererInit, context: Context, label: string, onInput: (opts: ActionInputOnInputMeta<string, State>) => void, setup: ActionInputSetup, resolve: () => void) => {
  const error = (value: string) => {
    mutateAtom(
      $contextState,
      (state) => state.input.error,
      value
    );
  };

  const onInputHandler = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
    let value: string | undefined;

    onInput({
      lang: options.storageData.get().meta[0],
      input,
      event,
      error,
      state: options.getStateFunction(context.id),
      get value() {
        if (value) return value;
        return (value = escapeHTML(input.value));
      },
    });
  };

  const input = document.createElement('input');

  input.setAttribute('type', 'text')
  input.setAttribute('name', 'novely-input')
  input.setAttribute('required', 'true')
  input.setAttribute('autocomplete', 'off')

  // @ts-expect-error Type is actually correct
  !context.meta.preview && input.addEventListener('input', onInputHandler);

  setup(input, (callback) => mutateAtom($contextState, (state) => state.input.cleanup, () => callback));

  mutateAtom(
    $contextState,
    (state) => state.input,
    {
      element: input,
      label,
      error: '',
      visible: true,
      resolve,
    }
  );

  /**
   * Initially run the fake input event to handle errors & etc
   */
  !context.meta.preview && input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}


const handleVibrateAction = vibrate;

export {
  handleBackgroundAction,
  handleDialogAction,
  handleChoiceAction,
  handleClearAction,
  handleCustomAction,
  handleClearCustomAction,
  handleTextAction,
  handleInputAction,
  handleVibrateAction
}
