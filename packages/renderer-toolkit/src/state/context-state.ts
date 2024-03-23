import type { NovelyScreen } from '@novely/core';
import type { DeepMapStore } from 'nanostores';
import { deepMap, onMount, cleanStores } from 'nanostores';

interface Disposable {
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

interface WithActionVisibility {
  /**
   * Used to check if something should be rendered
   */
  visible: boolean;
}

interface Labelled {
  /**
   * Label for the action.
   *
   * In example for Input action it might be "Enter youʼ age", and for Choice action it might be "Select youʼr next move"
   */
  label: string;
}

interface ContextStateBackground {
  /**
   * In-game background image
   */
  background: string;
  /**
   * Function that is NOT provided by core. You can set it yourself.
   */
  clear?: () => void;
}

interface ContextStateCharacter extends WithActionVisibility {
  /**
   * Basically `element.style`
   */
  style: string;
  /**
   * Character can be removed delayed so it could be removed with animation.
   *
   * Storing timeout id is needed to cancel it if in example ShowCharacter was called before time for removal came to the end to prevent character unexpectedly be removed
   */
  hideCharacterTimeoutId: ReturnType<typeof setTimeout>;
}

interface ContextStateCharacters {
  [key: string]: ContextStateCharacter;
}

interface ContextStateText extends Disposable {
  /**
   * Text to be rendered
   */
  content: string;
}

interface ContextStateDialog extends Disposable, WithActionVisibility {
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

interface ContextStateInput extends Disposable, WithActionVisibility, Labelled {
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

interface ContextStateChoice extends WithActionVisibility, Labelled {
  /**
   * It is an array of choices.
   *
   * First item of choice is a choice text and second one is active it or not.
   * When choice is not action it should be impossible to select that choice.
   */
  choices: [string, boolean][];
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
}

const CONTEXT_MAP = new Map<string, DeepMapStore<ContextState>>()

const createContextState = () => {
  const contextState = deepMap<ContextState>({
    background: {
      background: '',
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
      label: '',
      error: '',
      visible: false
    },
    text: {
      content: ''
    },
    meta: {
      restoring: false,
      goingBack: false,
      preview: false
    }
  });

  return contextState;
}

const useContextState = (id: string) => {
  const cached = CONTEXT_MAP.get(id);

  if (cached) return cached;

  const contextState = createContextState();

  CONTEXT_MAP.set(id, contextState)

  // todo: check this out
  onMount(contextState, () => {
    return () => {
      CONTEXT_MAP.delete(id);
    }
  })

  return contextState;
}

const removeContextState = (id: string) => {
  const contextState = CONTEXT_MAP.get(id);

  // todo: check this out
  if (contextState) {
    cleanStores(contextState)
  }

  CONTEXT_MAP.delete(id);
}

export { useContextState, removeContextState }
