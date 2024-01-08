import type { AtContextState, GlobalState } from './types';
import type { SetStoreFunction } from 'solid-js/store';

import { createStore } from 'solid-js/store';

const atContextStateMap = new Map<string, { state: AtContextState, setState: SetStoreFunction<AtContextState> }>();

const createContextState = () => {
  const [state, setState] = createStore<AtContextState>({
    background: '',
    characters: {},
    dialog: {
      content: '',
      name: '',
      visible: false,
      goingBack: false,
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
      goingBack: false,
    },
    layers: {},

    meta: {
      restoring: false
    }
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

  const contextState = createContextState();

  atContextStateMap.set(name, contextState);

  return contextState;
}

const createGlobalState = () => {
  const store = createStore<GlobalState>({
    screens: {},
    mainmenu: {
      items: [],
    },
    screen: 'mainmenu',
    exitPromptShown: false,
  })

  return store;
}

export { createContextState, createGlobalState, useContextState }
