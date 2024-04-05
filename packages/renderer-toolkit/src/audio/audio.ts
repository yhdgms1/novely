// !todo: move into submodule '/audio'

import type { AudioStore } from './types';
import type { AudioHandle, Context, Stored, StorageData, Data, Renderer } from '@novely/core';
import { Howl } from 'howler';

type AudioContext = Context['audio'];
type AudioMisc = Pick<Renderer['misc'], 'preloadAudioBlocking'>;
type StorageDataStore = Stored<StorageData<string, Data>>;

type KeepAudio = {
  music: Set<string>;
  sounds: Set<string>;
}

const TYPE_META_MAP = {
  'music': 2,
  'sound': 3,
  'voice': 4
} as const;

/**
 * Audio easy!
 *
 * This implementation uses Howler under the hood.
 *
 * @example
 * ```ts
 * const audio = createAudio(options.storageData);
 * ```
 */
const createAudio = (storageData: StorageDataStore) => {
  const store: AudioStore = {
    music: {},
    sound: {},
    voices: {},
    resumeList: []
  }

  const getVolume = (type: 'music' | 'sound' | 'voice') => {
    return storageData.get().meta[TYPE_META_MAP[type]];
  }

  const getHowl = (type: 'music' | 'sound' | 'voice', src: string) => {
    const kind = type === 'voice' ? 'voices' : type;
    const cached = store[kind][src];

    if (cached) return cached;

    const howl = new Howl({
      src,
      volume: getVolume(type),
    });

    store[kind][src] = howl;

    return howl;
  }

  const context: AudioContext = {
    music(src, method) {
      const resource = getHowl(method, src);

      this.start();

      return {
        pause() {
          resource.fade(getVolume(method), 0, 300);
          resource.once('fade', resource.pause);
        },
        play(loop) {
          if (resource.playing()) return;

          /**
           * Update
           */
          resource.loop(loop);

          resource.play();
          resource.fade(0, getVolume(method), 300);
        },
        stop() {
          resource.fade(getVolume(method), 0, 300);
          resource.once('fade', resource.stop);
        },
      } satisfies AudioHandle;
    },
    voice(source) {
      this.start();
      this.voiceStop();

      const resource = store.voice = getHowl('voice', source);

      resource.once('end', () => {
        store.voice = undefined;
      });

      resource.play();
    },
    voiceStop() {
      store.voice?.stop();
    },
    start() {
      if (!store.onDocumentVisibilityChangeListener) {
        const onDocumentVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            for (const howl of Object.values(store.music)) {
              if (howl && howl.playing()) {
                store.resumeList.push(howl);
                howl.pause();
              }
            }

            const currentVoice = store.voice;

            if (currentVoice && currentVoice.playing()) {
              store.resumeList.push(currentVoice)
              currentVoice.pause();
            }

          } else {
            for (const howl of store.resumeList) {
              howl.play();
            }

            store.resumeList = []
          }
        }

        document.addEventListener(
          'visibilitychange',
          store.onDocumentVisibilityChangeListener = onDocumentVisibilityChange
        );
      }
    },
    clear() {
      const musics = Object.values(store.music);
      const sounds = Object.values(store.sound);

      for (const music of [...musics, ...sounds]) {
        if (!music) continue;

        music.stop();
      }

      this.voiceStop();
    },
    destroy() {
      this.clear();

      if (store.onDocumentVisibilityChangeListener) {
        document.removeEventListener('visibilitychange', store.onDocumentVisibilityChangeListener);
      }
    }
  };

  /**
   * Used in clear action when audio should be cleared
   * @param keepAudio Passed from Clear Action
   */
  const clear = (keepAudio: KeepAudio) => {
    context.voiceStop();

    const musics = Object.entries(store.music).filter(([name]) => keepAudio.music && !keepAudio.music.has(name)).map(([_, h]) => h);
    const sounds = Object.entries(store.sound).filter(([name]) => keepAudio.sounds && !keepAudio.sounds.has(name)).map(([_, h]) => h);

    for (const music of [...musics, ...sounds]) {
      if (!music) continue;

      music.stop();
    }
  }

  /**
   * Subscribe for volume changes in settings
   */
  const unsubscribe = storageData.subscribe(() => {
    for (const type of ['music', 'sound', 'voice'] as const) {
      const volume = getVolume(type);

      if (type === 'music' || type === 'sound') {
        for (const howl of Object.values(store[type])) {
          if (!howl) continue;

          howl.fade(howl.volume(), volume, 150);
        }
      }

      if (type === 'voice') {
        const howl = store.voice;

        if (howl) {
          howl.fade(howl.volume(), volume, 150);
        }
      }
    }
  });

  return {
    context,

    clear,

    // todo: pass this where it needed
    unsubscribe,

    getVolume,
    getHowl
  }
}

const createAudioMisc = () => {
  const misc: AudioMisc = {
    preloadAudioBlocking: (src) => {
      return new Promise((resolve) => {
        /**
         * Howler automatically caches loaded sounds so this is enough
         */
        const howl = new Howl({
          src,
        });

        if (howl.state() === 'loaded') {
          resolve();
          return;
        }

        howl.once('load', resolve);
        howl.once('loaderror', () => resolve());
      })
    }
  };

  return misc;
}

export { createAudioMisc, createAudio, Howl }
