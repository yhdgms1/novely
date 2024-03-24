import type { Howl } from 'howler';

type AudioStore = {
  music: Partial<Record<string, Howl>>
  sound: Partial<Record<string, Howl>>
  voices: Partial<Record<string, Howl>>

  voice?: Howl;

  resumeList: Howl[];

  onDocumentVisibilityChangeListener?: () => void;
}

export type { AudioStore }
