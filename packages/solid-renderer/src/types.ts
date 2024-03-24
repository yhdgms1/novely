import type {
  CustomHandler,
  CustomHandlerGetResult,
  CharacterHandle,
  NovelyScreen,
  Context,
} from '@novely/core';
import type { JSX } from 'solid-js';
import type { MountableElement } from 'solid-js/web';

interface StateCharacter {
  /**
   * `element.style`
   */
  style: string;
  /**
   * Показывать ли элемент
   */
  visible: boolean;
  /**
   * `id` для `setTimeout`, который отвечает за `duration` в `hideCharacter`
   */
  timeoutId: ReturnType<typeof setTimeout>;
}

interface StateDialog {
  /**
   * Контент диалога
   */
  content: string;
  /**
   * Мини-персонаж
   */
  character?: string;
  /**
   * Эмоция мини-персонажа
   */
  emotion?: string;
  /**
   * Должен ли диалог быть показан
   */
  visible: boolean;
  /**
   * Имя персонажа
   */
  name: string;
  /**
   * Функция `resolve`
   */
  resolve?: () => void;
}

interface StateChoices {
  /**
   * Функция `resolve`
   * @param selected `index` выбранного
   */
  resolve?: (selected: number) => void;
  /**
   * Вопрос (а что выбирать)
   */
  question: string;
  /**
   * Выборы
   */
  choices: [string, boolean][];
  /**
   * Должен ли отображаться диалог
   */
  visible: boolean;
}

interface StateInput {
  /**
   * Вопрос (что делает этот input)
   */
  question: string;
  /**
   * Элемент `input`
   */
  element?: HTMLInputElement;
  /**
   * Должен ли отображаться диалог с `input`
   */
  visible: boolean;
  /**
   * Функция `resolve`
   */
  resolve?: () => void;
  /**
   * Запускается для очистки результата setup
   */
  cleanup?: () => void;
  /**
   * Ошибка
   */
  error: string;
}

interface StateText {
  /**
   * Текст
   */
  content: string;
  /**
   * Функция `resolve`
   */
  resolve?: () => void;
}

type StateLayers = Record<
  string,
  | {
    value: CustomHandlerGetResult<boolean>;
    fn: CustomHandler;
    clear: () => void;
    dom: null | HTMLDivElement;
  }
  | undefined
>;

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

type SolidContext = Omit<Context, 'store' | 'setStore'> & {
  store: SolidRendererStore;
  setStore: (fn: (value: SolidRendererStore) => void) => void;
}

type RendererStoreExtension = { screens: Record<string, StateScreen>; mainmenu: StateMainmenuItems }

export type {
  EmitterEventsMap,
  StateCharacter,
  StateChoices,
  StateDialog,
  StateInput,
  StateText,
  StateLayers,
  StateScreen,
  StateScreens,
  PossibleScreen,
  StateMainmenuItem,
  StateMainmenuItems,
  SolidRendererStore,
  CreateSolidRendererOptions,
  SolidContext,
  RendererStoreExtension
}
