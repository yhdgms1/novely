import type { AtContextState } from './types';
import type { SetStoreFunction } from 'solid-js/store';

import { createStore } from 'solid-js/store';

const atContextStateMap = new Map<
  string,
  {
    state: AtContextState,
    setState: SetStoreFunction<AtContextState>,

    remove: () => void;
  }
>();

const createContextState = () => {
  const [state, setState] = createStore<AtContextState>({
    disposeBackground: undefined,
    background: '',
    characters: {},
    dialog: {
      content: '',
      name: '',
      visible: false,
    },
    choices: {
      question: '',
      visible: false,
      choices: [],
    },
    input: {
      question: '',
      error: '',
      visible: false,
    },
    text: {
      content: '',
    },
    layers: {},

    meta: {
      restoring: false,
      preview: false,
      goingBack: false
    },

    store: {
      characters: {},
    },
  });

  return {
    state,
    setState
  }
}

const useContextState = (name: string) => {
  const cached = atContextStateMap.get(name);

  if (cached) {
    return cached;
  }

  const remove = () => {
    atContextStateMap.delete(name);
  }

  const { state, setState } = createContextState();

  const contextState = {
    state,
    setState,
    remove
  }

  atContextStateMap.set(name, contextState);

  return contextState;
}

export { createContextState, useContextState }
