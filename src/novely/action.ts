import type { DefaultDefinedCharacter, } from './character';
import type { Thenable } from './types'

export enum Action {
  // Choice,
  // Clear,
  // Condition,
  // Dialog,
  // End,
  // Gallery - не нужно согласни идеологии
  // HideCanvas, - можно сделать по другому
  // HideCharacter,
  HideImage,
  HideParticles,
  HideVideo,
  // Input,
  // Function,
  // Jump,
  Next,
  // Placeholder - не понимаю что это
  // PlayMusic,
  PlaySound,
  PlayVoice,
  // ShowCanvas,
  // ShowBackground,
  // ShowCharacter,
  ShowImage,
  ShowMessage,
  ShowNotification,
  ShowParticles,
  // ShowScene, The scene action will change the background and clear the screen, removing all characters, images and text currently displayed. - можно же сделать просто Clear, не?
  ShowVideo,
  StopMusic,
  StopSound,
  StopVoice,
  Vibrate,
  // Wait
}

/**
 * Не лучшее решение, но наиболее простое
 */
export type ValidAction = [keyof ActionProxyProvider<Record<string, DefaultDefinedCharacter>>, Parameters<ActionProxyProvider<Record<string, DefaultDefinedCharacter>>[keyof ActionProxyProvider<Record<string, DefaultDefinedCharacter>>]>]

export type Story = Record<string, ValidAction[]>;

export type ActionProxyProvider<Characters extends Record<string, DefaultDefinedCharacter>> = {
  choice: (...choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[]) => ValidAction;
  clear: () => ValidAction;
  condition: <T extends string>(condition: () => T, variants: Record<T, ValidAction[]>) => ValidAction;
  dialog: {
    <C extends keyof Characters>(person: C, content: string, emotion?: keyof Characters[C]['emotions']): ValidAction;
    (person: undefined, content: string, emotion?: undefined): ValidAction;
    (person: string, content: string, emotion?: undefined): ValidAction;
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

  input: (question: string, onInput: (meta: { input: HTMLInputElement, error: HTMLSpanElement, event: InputEvent & { currentTarget: HTMLInputElement } }) => void, setup?: (input: HTMLInputElement) => void) => ValidAction;
}

export type DefaultActionProxyProvider = ActionProxyProvider<Record<string, DefaultDefinedCharacter>>;
export type GetActionParameters<T extends Capitalize<keyof DefaultActionProxyProvider>> = Parameters<DefaultActionProxyProvider[Uncapitalize<T>]>;
