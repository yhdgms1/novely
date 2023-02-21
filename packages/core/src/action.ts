import type { DefaultDefinedCharacter, } from './character';
import type { Thenable } from './types'

type ValidAction = [keyof DefaultActionProxyProvider, Parameters<DefaultActionProxyProvider[keyof DefaultActionProxyProvider]>]

type Story = Record<string, ValidAction[]>;

type DialogContent = string | ((lang: string) => string | ((obj: Record<string, unknown>) => string))
type ChoiceContent = string | ((lang: string) => string | ((obj: Record<string, unknown>) => string))

type ActionProxyProvider<Characters extends Record<string, DefaultDefinedCharacter>> = {
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
}

type DefaultActionProxyProvider = ActionProxyProvider<Record<string, DefaultDefinedCharacter>>;
type GetActionParameters<T extends Capitalize<keyof DefaultActionProxyProvider>> = Parameters<DefaultActionProxyProvider[Uncapitalize<T>]>;

export type { ValidAction, Story, ActionProxyProvider, DefaultActionProxyProvider, GetActionParameters, DialogContent, ChoiceContent }