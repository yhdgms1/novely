import type { BackgroundImage, Context, DefaultActionProxy, RendererInit, CustomHandler, State, CustomHandlerFunctionGetFn } from '@novely/core'
import type { ContextState, ContextStateStore } from '../state/context-state'
import type { RendererStateStore } from '../state/renderer-state'
import type { DeepMapStore } from 'nanostores'

import { useBackground } from './background'

const handleBackgroundAction = ($contextState: DeepMapStore<ContextStateStore<any>>, background: string | BackgroundImage) => {
  const { clear } = $contextState.get().background;

  clear && clear();

  if (typeof background === 'string') {
    $contextState.setKey('background.background', background);

    return;
  }

  const { dispose } = useBackground(background, (value) => {
    $contextState.setKey('background.background', value);
  })

  $contextState.setKey('background.clear', dispose);
}

const handleDialogAction = ($contextState: DeepMapStore<ContextStateStore<any>>, content: string, name: string, character: string | undefined, emotion: string | undefined, resolve: () => void) => {
  $contextState.setKey('dialog', {
    content,
    name,
    miniature: {
      character,
      emotion,
    },
    visible: true,
    resolve,
  });
}

const handleChoiceAction = ($contextState: DeepMapStore<ContextStateStore<any>>, label: string, choices: [name: string, active: boolean][], resolve: (selected: number) => void) => {
  $contextState.setKey('choice', { choices, label, resolve, visible: true });
}

const handleClearAction = ($rendererState: DeepMapStore<RendererStateStore<any>>, $contextState: DeepMapStore<ContextStateStore<any>>, context: Context, keep: Set<keyof DefaultActionProxy>, keepCharacters: Set<string>) => {
  $rendererState.setKey('exitPromptShown', false);

  if (!keep.has('showBackground')) {
    $contextState.setKey('background.background', '#000');
  }

  if (!keep.has('choice')) {
    $contextState.setKey('choice', {
      choices: [],
      visible: false,
      label: '',
    });
  }

  if (!keep.has('input')) {
    $contextState.setKey('input', {
      element: null,
      label: '',
      visible: false,
      error: '',
    });
  }

  if (!keep.has('dialog')) {
    $contextState.setKey('dialog', { visible: false, content: '', name: '', miniature: {} });
  }

  if (!keep.has('text')) {
    $contextState.setKey('text', { content: '' });
  }

  const { characters, custom } = $contextState.get() as ContextState;

  for (const character of Object.keys(characters)) {
    if (!keepCharacters.has(character)) {
      $contextState.setKey(`characters.${character}`, {
        style: undefined,
        visible: false
      })
    }
  }

  for (const [id, handler] of Object.entries(custom)) {
    if (!handler) continue;
    if (context.meta.goingBack && handler.fn.skipClearOnGoingBack) continue;

    handler.clear();
    $contextState.setKey(`custom.${id}`, undefined);
  }
}

/**
 * You MUST return value returned by this function
 */
const handleCustomAction = ($contextState: DeepMapStore<ContextStateStore<any>>, options: RendererInit, context: Context, fn: CustomHandler<string, State>, resolve: () => void) => {
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
      $contextState.setKey(`custom.${fn.key}`, undefined);
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

    $contextState.setKey(`custom.${fn.key}`, {
      dom: element,
      fn,
      getReturn,

      clear: clearManager,
    })

    return getReturn
  };

  const result = fn({
    get,

    goingBack: context.meta.goingBack,
    preview: context.meta.preview,

    lang: options.storageData.get().meta[0],

    state: options.getStateFunction(context.id)
  });

  result ? result.then(resolve) : resolve();

  return result;
}

const handleClearCustomAction = ($contextState: DeepMapStore<ContextStateStore<any>>, fn: CustomHandler<string, State>) => {
  const data = $contextState.get().custom[fn.key];

  if (data) data.clear();
}

const handleTextAction = ($contextState: DeepMapStore<ContextStateStore<any>>, content: string, resolve: () => void) => {
  $contextState.setKey('text', { content, resolve })
}

export {
  handleBackgroundAction,
  handleDialogAction,
  handleChoiceAction,
  handleClearAction,
  handleCustomAction,
  handleClearCustomAction,
  handleTextAction
}
