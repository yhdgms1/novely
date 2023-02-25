import type { Character } from './character';
import type { Thenable } from './types'

type ValidAction = [keyof DefaultActionProxyProvider, Parameters<DefaultActionProxyProvider[keyof DefaultActionProxyProvider]>]

type Story = Record<string, ValidAction[]>;

type DialogContent = string | ((lang: string, obj: Record<string, unknown>) => string);
type ChoiceContent = string | ((lang: string, obj: Record<string, unknown>) => string);

type CustomHandlerGetResultDataFunction = {
  (): Record<string, unknown>;
  (data: Record<string, unknown>): void;
}

type CustomHandlerGetResultSkipClearOnGoingBackFunction = {
  (): boolean;
  (value: boolean): void;
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
  element: HTMLDivElement;
  /**
   * Будет ли запускаться очистка при проходе назад
   */
  skipClearOnGoingBack: CustomHandlerGetResultSkipClearOnGoingBackFunction
  /**
   * Устанавливает обработчик очистки
   */
  clear: (fn: () => void) => void;
};

type CustomHandlerFunction = (get: (id: string) => CustomHandlerGetResult, goingBack: boolean, resolve: () => void) => Thenable<void>;

type CustomHandler = CustomHandlerFunction & {
  callOnlyLatest?: boolean;
  requireUserAction?: boolean
};

type ActionProxyProvider<Characters extends Record<string, Character>> = {
  choice: (...choices: ([ChoiceContent, ValidAction[]] | [ChoiceContent, ValidAction[], () => boolean])[]) => ValidAction;
  clear: () => ValidAction;
  condition: <T extends string>(condition: () => T, variants: Record<T, ValidAction[]>) => ValidAction;
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
  wait: (time: number) => ValidAction;
  function: (fn: () => Thenable<void>) => ValidAction;

  input: (question: string, onInput: (meta: { input: HTMLInputElement, error: (error: string) => void, event: InputEvent & { currentTarget: HTMLInputElement } }) => void, setup?: (input: HTMLInputElement) => void) => ValidAction;

  custom: (handler: CustomHandler) => ValidAction;
}

type DefaultActionProxyProvider = ActionProxyProvider<Record<string, Character>>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxyProvider>> = Parameters<DefaultActionProxyProvider[Uncapitalize<T>]>;

export type { ValidAction, Story, ActionProxyProvider, DefaultActionProxyProvider, GetActionParameters, DialogContent, ChoiceContent, CustomHandler, CustomHandlerGetResult, CustomHandlerGetResultDataFunction, CustomHandlerGetResultSkipClearOnGoingBackFunction }