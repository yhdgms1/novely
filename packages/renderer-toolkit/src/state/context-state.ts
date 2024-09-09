import type { CustomHandler, CustomHandlerGetResult } from '@novely/core';
import type { BaseDeepMap } from 'nanostores';
import type { DeepAtom } from '../atoms/deep-atom';
import { onMount, cleanStores } from 'nanostores';
import { deepAtom } from '../atoms/deep-atom';

type Disposable = {
  /**
   * Function that is called after action is completed and game should move forward
   *
   * @example
   * ```ts
   * function handleTextActionClick() {
   *   const { resolve } = contextState.get().text;
   *
   *   // as user clicked on text we will hide text by updating this store
   *   contextState.setKey('text', { content: '' });
   *
   *   // now proceed to go to next action
   *   resolve()
   * }
   * ```
   */
  resolve?: () => void;
}

type WithActionVisibility = {
  /**
   * Used to check if something should be rendered
   */
  visible: boolean;
}

type Labelled = {
  /**
   * Label for the action.
   *
   * In example for Input action it might be "Enter youʼ age", and for Choice action it might be "Select youʼr next move"
   */
  label: string;
}

type ContextStateBackground = {
  /**
   * In-game background image
   */
  background: string;
  /**
   * Function that is NOT provided by core. You can set it yourself.
   */
  clear?: () => void;
}

type ContextStateCharacter = WithActionVisibility & {
  /**
   * Basically `element.style`
   */
  style: string | undefined;
  /**
   * Character removal can be delayed so it could be removed with animation.
   *
   * Storing timeout id is needed to cancel it if in example ShowCharacter was called before time for removal came to the end to prevent character unexpectedly be removed
   */
  hideTimeoutId?: ReturnType<typeof setTimeout>;
}

type ContextStateCharacters = {
  [key: string]: ContextStateCharacter | undefined;
}

type ContextStateCustomHandler = {
  /**
   * Node in which custom action is rendered
   */
  node: null | HTMLDivElement;
  /**
   * Custom Handler function itself
   */
  fn: CustomHandler;
  /**
   * Clear Function. Removes the action.
   */
  clear: () => void;
}

type ContextStateCustomHandlers = {
  [key: string]: ContextStateCustomHandler | undefined
}

type ContextStateText = Disposable & {
  /**
   * Text to be rendered
   */
  content: string;
}

type ContextStateDialog = Disposable & WithActionVisibility & {
  /**
   * Character lyrics
   */
  content: string;
  /**
   * Character lyrics. It might be also empty
   */
  name: string;
  /**
   * Miniature character rendered along with text
   */
  miniature: {
    /**
     * Character
     */
    character?: string;
    /**
     * Character's emotion
     */
    emotion?: string;
  }
}

type ContextStateInput = Disposable & WithActionVisibility & Labelled & {
  /**
   * Input Element. Input action very dependent on DOM so this is needed
   */
  element: null | HTMLInputElement;
  /**
   * When input validation failed this error message should be shown near input element.
   * When error is present, going to next action should be restricted.
   */
  error: string;
  /**
   * Function that should be called before input action should be removed
   */
  cleanup?: () => void;
}

type ContextStateChoice = WithActionVisibility & Labelled & {
  /**
   * It is an array of choices.
   *
   * When choice is not action it should be impossible to select that choice.
   */
  choices: [title: string, active: boolean, visible: boolean, image: string][];
  /**
   * Function that is called after choice was made and game should move forward
   * @param selected index
   * @example
   * ```ts
   * function handleChoiceActionSelection() {
   *   const index = document.querySelector('select.choice').selectedIndex;
   *
   *   const { resolve } = contextState.get().choice;
   *
   *   // pass index
   *   resolve(index);
   *
   *   contextState.setKey('choice', { choices: [] });
   * }
   * ```
   */
  resolve?: (selected: number) => void;
}

type ContextStateMeta = {
  /**
   * Is it currently in restoring phase
   */
  restoring: boolean
  /**
   * Is it in preview mode
   *
   * In this mode game should be un-playable
   */
  preview: boolean
  /**
   * Is Novely in goingBack state
   */
  goingBack: boolean
}

/**
 * State which is related to game contexts and contains data about it
 */
type ContextState = {
  /**
   * ShowBackground action.
   */
  background: ContextStateBackground;
  /**
   * Character information.
   */
  characters: ContextStateCharacters;
  /**
   * Text action. Basically shown over other action
   */
  text: ContextStateText;
  /**
   * Dialog action.
   */
  dialog: ContextStateDialog;
  /**
   * Input action.
   */
  input: ContextStateInput;
  /**
   * Choice action.
   */
  choice: ContextStateChoice;
  /**
  * Meta information about current context
  */
  meta: ContextStateMeta;
  /**
   * Custom Action store
   */
  custom: ContextStateCustomHandlers;
}

const defaultEmpty = {} satisfies BaseDeepMap;

type ContextStateStore<Extension extends BaseDeepMap = typeof defaultEmpty> = ContextState & Extension

const getDefaultContextState = (): ContextState => {
  return {
    background: {
      background: '#000',
    },
    characters: {},
    choice: {
      label: '',
      visible: false,
      choices: [],
    },
    dialog: {
      content: '',
      name: '',
      visible: false,
      miniature: {},
    },
    input: {
      element: null,
      label: '',
      error: '',
      visible: false
    },
    text: {
      content: ''
    },
    custom: {},
    meta: {
      restoring: false,
      goingBack: false,
      preview: false
    }
  }
}

/**
 * Creates typed context state root
 *
 * @example
 * ```ts
 * const { useContextState, removeContextState } = createContextStateRoot<{ additionalContextProp: number }>(() => {
 *   return {
 *     additionalContextProp: 123
 *   }
 * });
 *
 * // when you want to create or get context state
 * useContextState('id here')
 *
 * // when context state should be removed
 * removeContextState('id here')
 * ```
 */
const createContextStateRoot = <Extension extends BaseDeepMap = typeof defaultEmpty>(getExtension: () => Extension = () => ({}) as Extension) => {
  const CACHE = new Map<string, DeepAtom<ContextStateStore<Extension>>>();

  const make = () => {
    const contextState = deepAtom<ContextStateStore<Extension>>({
      ...getDefaultContextState(),
      ...getExtension()
    } as ContextStateStore<Extension>);

    return contextState;
  }

  const remove = (id: string) => {
    const contextState = CACHE.get(id);

    if (contextState) {
      cleanStores(contextState)
    }

    CACHE.delete(id);
  }

  const use = (id: string) => {
    const cached = CACHE.get(id);

    if (cached) {
      return cached;
    }

    const contextState = make();

    CACHE.set(id, contextState);

    onMount(contextState, () => {
      return () => {
        CACHE.delete(id);
      }
    })

    return contextState;
  }

  return {
    useContextState: use,
    removeContextState: remove
  }
}

export { createContextStateRoot }
export type {
  ContextStateStore,
  ContextState,
  ContextStateCharacter,
  ContextStateCustomHandler
}
