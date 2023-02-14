import type { DefaultActionProxyProvider } from './action'

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
  choices: (choices: Parameters<DefaultActionProxyProvider['choice']>) => (resolve: (selected: number) => void) => void;
  input: (question: string, onInput: Parameters<DefaultActionProxyProvider['input']>[1], setup?: Parameters<DefaultActionProxyProvider['input']>[2]) => (resolve: () => void) => void;
  music: (source: string, method: keyof RendererStore['audio']) => AudioHandle;
  clear: () => (resolve: () => void) => void;
  store: RendererStore;

  ui: {
    /**
     * Показывает экран, скрывает другие
     */
    showScreen(name: "mainmenu" | "game" | "saves"): void;
  }
}

export type { CharacterHandle, AudioHandle, RendererStore, Renderer }