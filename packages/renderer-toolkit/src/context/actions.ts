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
import type { DeepAtom } from '../atoms/deep-atom'

import { vibrate } from './vibrate'
import { useBackground } from './background'
import { escapeHTML, noop } from '../utils'

const allEmpty = (target: object | string | number | null | undefined) => {
  if (typeof target === 'string') {
    return target == '';
  }

  if (typeof target === 'number') {
    return target == 0;
  }

  if (!target) {
    return true;
  }

  if (Array.isArray(target) && target.length > 0) {
    for (const inner of target) {
      if (!allEmpty(inner)) {
        return false;
      }
    }
  }

  for (const value of Object.values(target)) {
    if (!allEmpty(value)) {
      return false;
    }
  }

  return true;
}

const handleBackgroundAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, background: string | BackgroundImage, onChange?: (currentBackground: string) => void) => {
  const { clear } = $contextState.get().background;

  clear && clear();

  if (typeof background === 'string') {
    $contextState.mutate((s) => s.background.background, background);
    onChange?.(background);

    return;
  }

  const { dispose } = useBackground(background, (value) => {
    $contextState.mutate((s) => s.background.background, value);
    onChange?.(value);
  })

  $contextState.mutate((s) => s.background.clear, () => dispose);
}

const handleDialogAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, content: string, name: string, character: string | undefined, emotion: string | undefined, resolve: () => void) => {
  $contextState.mutate(
    (s) => s.dialog,
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
  );
}

const handleChoiceAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, label: string, choices: [name: string, active: boolean][], resolve: (selected: number) => void) => {
  $contextState.mutate(
    (s) => s.choice,
    { choices, label, resolve, visible: true }
  );
}

const handleClearAction = ($rendererState: DeepAtom<RendererStateStore<Record<PropertyKey, unknown>>>, $contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, context: Context, keep: Set<keyof DefaultActionProxy>, keepCharacters: Set<string>) => {
  $rendererState.mutate((s) => s.exitPromptShown, false);

  if (!keep.has('showBackground')) {
    $contextState.mutate((s) => s.background.background, '#000');
  }

  if (!keep.has('choice')) {
    $contextState.mutate(
      (s) => s.choice,
      {
        choices: [],
        visible: false,
        label: '',
      }
    );
  }

  const inputCleanup = $contextState.get().input.cleanup;

  if (inputCleanup) {
    inputCleanup();
  }

  if (!keep.has('input')) {
    $contextState.mutate(
      (s) => s.input,
      {
        element: null,
        label: '',
        visible: false,
        error: '',
      }
    );
  }

  if (!keep.has('dialog')) {
    $contextState.mutate(
      (s) => s.dialog,
      {
        visible: false,
        content: '',
        name: '',
        miniature: {}
      }
    );
  }

  if (!keep.has('text')) {
    $contextState.mutate((s) => s.text, { content: '' });
  }

  const { characters, custom } = $contextState.get() as ContextState;

  for (const character of Object.keys(characters)) {
    if (!keepCharacters.has(character)) {
      $contextState.mutate(
        (s) => s.characters[character],
        {
          style: undefined,
          visible: false
        }
      );
    }
  }

  for (const [id, handler] of Object.entries(custom)) {
    if (!handler) continue;
    if (context.meta.goingBack && handler.fn.skipClearOnGoingBack) continue;

    handler.clear();
    $contextState.mutate((s) => s.custom[id], undefined);
  }
}

/**
 * You MUST return value returned by this function
 */
const handleCustomAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, options: RendererInit<any, any>, context: Context, fn: CustomHandler<string, State>, resolve: () => void) => {
  const getDomNodes = (insert = true) => {
    const cached = $contextState.get().custom[fn.key]

    if (cached) {
      return cached.domNodes;
    }

    const createElement = () => {
      const div = document.createElement('div');

      div.setAttribute('data-id', fn.key);

      return div;
    }

    const element = insert ? createElement() : null;

    const domNodes = {
      root: context.root,
      element,
    }

    $contextState.mutate(
      (s) => s.custom[fn.key],
      {
        fn,
        domNodes,

        localData: {},

        cleanup: noop,
        clear: remove,
      }
    );

    return domNodes
  };

  const getStoredCustomAction = () => {
    return $contextState.get().custom[fn.key]
  }

  /**
   * Cleanup function
   */
  const setClear = (clear: typeof noop) => {
    if (getStoredCustomAction()) {
      $contextState.mutate(
        (s) => s.custom[fn.key]!.cleanup,
        () => clear
      )
    }
  }

  /**
   * Local data
   *
   * This thing is used to keep some state between custom action instances.
   */
  const data = (updatedData?: any) => {
    if (updatedData && getStoredCustomAction()) {
      return $contextState.mutate(
        (s) => s.custom[fn.key]!.localData,
        updatedData
      )
    }

    return getStoredCustomAction()!.localData
  }

  /**
   * Clear action and then remove it
   */
  const remove = () => {
    getStoredCustomAction()!.cleanup();
    $contextState.mutate((s) => s.custom[fn.key], undefined);
  };

  const result = fn({
    flags: {
      ...context.meta,
    },

    lang: options.storageData.get().meta[0],

    state: options.getStateFunction(context.id),
    data,

    clear: setClear,
    remove: remove,

    rendererContext: context,

    getDomNodes: getDomNodes as CustomHandlerFunctionGetFn
  });

  result ? result.then(resolve) : resolve();

  return result;
}

const handleClearCustomAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, fn: CustomHandler<string, State>) => {
  const data = $contextState.get().custom[fn.key];

  console.log(data)
  if (data) data.clear();
}

const handleClearBlockingActions = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, preserve?: "choice" | "dialog" | "input" | "text" | undefined) => {
  const current = $contextState.get()

  if (preserve !== 'choice' && !allEmpty(current.choice)) {
    $contextState.mutate(
      (s) => s.choice,
      {
        choices: [],
        visible: false,
        label: '',
      }
    );
  }

  if (preserve !== 'input' && !allEmpty(current.input)) {
    $contextState.mutate(
      (s) => s.input,
      {
        element: null,
        label: '',
        visible: false,
        error: '',
      }
    );
  }

  if (preserve !== 'text' && !allEmpty(current.text)) {
    $contextState.mutate((s) => s.text, { content: '' });
  }

  if (preserve !== 'dialog' && !allEmpty(current.dialog)) {
    $contextState.mutate(
      (s) => s.dialog,
      {
        visible: false,
        content: '',
        name: '',
        miniature: {}
      }
    );
  }
}

const handleTextAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, content: string, resolve: () => void) => {
  $contextState.mutate((s) => s.text, { content, resolve });
}

const handleInputAction = ($contextState: DeepAtom<ContextStateStore<Record<PropertyKey, unknown>>>, options: RendererInit<any, any>, context: Context, label: string, onInput: (opts: ActionInputOnInputMeta<string, State>) => void, setup: ActionInputSetup, resolve: () => void) => {
  const error = (value: string) => {
    $contextState.mutate((s) => s.input.error, value);
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

  $contextState.mutate(
    (s) => s.input,
    {
      element: input,
      label,
      error: '',
      visible: true,
      cleanup: setup(input) || noop,
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
  handleClearBlockingActions,
  handleTextAction,
  handleInputAction,
  handleVibrateAction
}
