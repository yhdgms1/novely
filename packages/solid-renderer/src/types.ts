import type {
  CharacterHandle,
  NovelyScreen,
} from '@novely/core';
import type { JSX } from 'solid-js';
import type { MountableElement } from 'solid-js/web';

type StateScreen = () => {
  mount(): Element | JSX.Element;
  unmount?(): void;
};

type StateScreens = Record<string, StateScreen>;

type PossibleScreen = NovelyScreen | (string & Record<never, never>);

type StateMainmenuItem = (goto: (name: PossibleScreen) => void) => JSX.ButtonHTMLAttributes<HTMLButtonElement>;
type StateMainmenuItems = StateMainmenuItem[];

type SolidRendererStore = {
  characters: Record<string, CharacterHandle>;
}

type CreateSolidRendererOptions = {
  /**
   * Enter fullscreen mode when opening a game, exit when opening main-menu
   * @default false
   */
  fullscreen?: boolean;
  /**
   * Controls position
   * @default "outside"
   */
  controls?: 'inside' | 'outside';
  /**
   * When `goingBack` typewriter effect won't be applied
   * @default true
   */
  skipTypewriterWhenGoingBack?: boolean;
  /**
   * Where Novely will be mounted
   * @default document.body
   */
  target?: MountableElement;
  /**
   * In the settings screen languages will be shown in it's own language instead of selected language
   * @default true
   */
  useNativeLanguageNames?: boolean;
}

type EmitterEventsMap = {
  'screen:change': PossibleScreen | 'loading',
};

type RendererStoreExtension = { screens: Record<string, StateScreen>; mainmenu: StateMainmenuItems }

export type {
  EmitterEventsMap,
  StateScreen,
  StateScreens,
  PossibleScreen,
  StateMainmenuItem,
  StateMainmenuItems,
  SolidRendererStore,
  CreateSolidRendererOptions,
  RendererStoreExtension
}
