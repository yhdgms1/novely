import type { DefaultActionProxyProvider, ValidAction } from './action'
import type { Character } from './character'
import type { Storage } from './storage'
import type { Save, Stack, StorageData, Thenable } from './types'
import type { BaseTranslationStrings } from '@novely/t9n'
import { Stored } from './store'

interface CharacterHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  withEmotion: (emotion: string) => () => void;
  append: (className?: string, style?: string) => void;
  remove: (className?: string, style?: string, duration?: number) => (resolve: () => void) => void;

  emotions: Record<string, HTMLImageElement | Record<"head" | "left" | "right", HTMLImageElement>>
}

interface AudioHandle {
  element: HTMLAudioElement;

  stop: () => void;
  pause: () => void;
  play: () => void;
}

interface RendererStore {
  characters: Record<string, CharacterHandle>
  audio: Partial<Record<"music", AudioHandle>>
}

type Renderer = {
  character: (character: string) => CharacterHandle;
  background: (background: string) => void;
  dialog: (content: string, character?: string, emotion?: string) => (resolve: () => void) => void;
  choices: (choices: ([string, ValidAction[]] | [string, ValidAction[], () => boolean])[]) => (resolve: (selected: number) => void) => void;
  input: (question: string, onInput: Parameters<DefaultActionProxyProvider['input']>[1], setup?: Parameters<DefaultActionProxyProvider['input']>[2]) => (resolve: () => void) => void;
  music: (source: string, method: keyof RendererStore['audio']) => AudioHandle;
  clear: (goingBack: boolean) => (resolve: () => void) => void;
  custom: (fn: Parameters<DefaultActionProxyProvider['custom']>[0], goingBack: boolean, push: () => void) => Thenable<void>;
  store: RendererStore;

  ui: {
    /**
     * Показывает экран, скрывает другие
     */
    showScreen(name: "mainmenu" | "game" | "saves" | "settings" | 'loading'): void;
  }
}

type RendererInit = {
  characters: Record<string, Character>;
  storage: Storage;
  set: (save: Save) => Promise<void>;
  restore: (save?: Save) => Promise<void>;
  save: (override?: boolean, type?: Save[2][1]) => Promise<void>;
  newGame: () => void;
  stack: Stack;
  languages: string[];

  /**
   * Translation function
   */
  t: (key: BaseTranslationStrings, lang: string) => string;
  /**
   * Store that tracks data updates
   */
  $: Stored<StorageData>;
}

export type { CharacterHandle, AudioHandle, RendererStore, Renderer, RendererInit }