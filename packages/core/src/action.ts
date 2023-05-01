import type { Character } from './character';
import type { Thenable } from './types'

type ValidAction =
  | ['choice', [number]]
  | ['clear', []]
  | ['condition', [() => boolean, Record<string, ValidAction[]>]]
  | ['dialog', [string | undefined, DialogContent, string | undefined]]
  | ['end', []]
  | ['showBackground', [string]]
  | ['playMusic', [string]]
  | ['stopMusic', [string]]
  | ['jump', [string]]
  | ['showCharacter', [string, keyof Character['emotions'], string?, string?]]
  | ['hideCharacter', [string, string?, string?, number?]]
  | ['animateCharacter', [string, number, ...string[]]]
  | ['wait', [number]]
  | ['function', [() => Thenable<void>]]
  | ['input', [string, (meta: { input: HTMLInputElement, error: (error: string) => void, event: InputEvent & { currentTarget: HTMLInputElement } }) => void, ((input: HTMLInputElement) => void)?]]
  | ['custom', [CustomHandler]]
  | ['vibrate', [...number[]]]
  | ['next', []]
  | ['text', [...string[]]]
  | ValidAction[]

type Story = Record<string, ValidAction[]>;

type DialogContent = string | ((lang: string, obj: Record<string, unknown>) => string);
type ChoiceContent = string | ((lang: string, obj: Record<string, unknown>) => string);
type TextContent = string | ((lang: string, obj: Record<string, unknown>) => string);

type CustomHandlerGetResultDataFunction = {
  (data?: Record<string, unknown>): Record<string, unknown>;
}

type CustomHandlerGetResult = {
  delete: () => void;
  /**
   * Данные
   */
  data: CustomHandlerGetResultDataFunction;
  /**
   * Элемент слоя
   */
  element: HTMLDivElement | null;
  /**
   * Корневой элемент Novely
   */
  root: HTMLElement;
  /**
   * Устанавливает обработчик очистки
   */
  clear: (fn: () => void) => void;
};

type CustomHandlerFunction = (get: (id: string, insert?: boolean) => CustomHandlerGetResult, goingBack: boolean, resolve: () => void) => Thenable<void>;

type CustomHandler = CustomHandlerFunction & {
  callOnlyLatest?: boolean;
  requireUserAction?: boolean;
  skipClearOnGoingBack?: boolean;
};

type ActionProxyProvider<Characters extends Record<string, Character>> = {
  choice: {
    (...choices: ([ChoiceContent, ValidAction[]] | [ChoiceContent, ValidAction[], () => boolean])[]): ValidAction;
    (question: string, ...choices: ([ChoiceContent, ValidAction[]] | [ChoiceContent, ValidAction[], () => boolean])[]): ValidAction;
  }
  clear: () => ValidAction;
  condition: <T extends string | true | false>(condition: () => T, variants: Record<T extends true ? 'true' : T extends false ? 'false' : T, ValidAction[]>) => ValidAction;
  exit: () => ValidAction;
  dialog: {
    <C extends keyof Characters>(person: C, content: DialogContent, emotion?: keyof Characters[C]['emotions']): ValidAction;
    (person: undefined, content: DialogContent, emotion?: undefined): ValidAction;
    (person: string, content: DialogContent, emotion?: undefined): ValidAction;
  }
  end: () => ValidAction;
  showBackground: (background: string) => ValidAction;

  playMusic: (audio: string) => ValidAction;
  stopMusic: (audio: string) => ValidAction;

  jump: (scene: string) => ValidAction;

  showCharacter: {
    <C extends keyof Characters>(character: C, emotion: keyof Characters[C]['emotions'], className?: string, style?: string): ValidAction
  }
  hideCharacter: {
    <C extends keyof Characters>(character: C, className?: string, style?: string, duration?: number): ValidAction
  }
  animateCharacter: {
    <C extends keyof Characters>(character: C, timeout: number, ...classes: string[]): ValidAction;
  }
  wait: (time: number) => ValidAction;
  function: (fn: () => Thenable<void>) => ValidAction;

  input: (question: string, onInput: (meta: { input: HTMLInputElement, error: (error: string) => void, event: InputEvent & { currentTarget: HTMLInputElement } }) => void, setup?: (input: HTMLInputElement) => void) => ValidAction;

  custom: (handler: CustomHandler) => ValidAction;

  vibrate: (...pattern: number[]) => ValidAction;

  next: () => ValidAction;

  text: (...text: TextContent[]) => ValidAction;
}

type DefaultActionProxyProvider = ActionProxyProvider<Record<string, Character>>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxyProvider>> = Parameters<DefaultActionProxyProvider[Uncapitalize<T>]>;

export type { ValidAction, Story, ActionProxyProvider, DefaultActionProxyProvider, GetActionParameters, DialogContent, ChoiceContent, TextContent, CustomHandler, CustomHandlerGetResult, CustomHandlerGetResultDataFunction, }