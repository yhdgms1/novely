import type { AudioHandle, Context, Data, Renderer, StorageData, Stored } from '@novely/core';
import { createAudio as createWebAudio, prefetchAudio } from 'simple-web-audio';
import { noop } from '../utils';
import type { AudioStore } from './types';

type AudioContext = Context['audio'];
type AudioMisc = Pick<Renderer['misc'], 'preloadAudioBlocking'>;
type StorageDataStore = Stored<StorageData<string, Data>>;

type KeepAudio = {
	music: Set<string>;
	sounds: Set<string>;
};

const TYPE_META_MAP = {
	music: 2,
	sound: 3,
	voice: 4,
} as const;

/**
 * Audio easy! This implementation uses `simple-web-audio` package under the hood.
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
	};

	const getVolume = (type: 'music' | 'sound' | 'voice') => {
		return storageData.get().meta[TYPE_META_MAP[type]];
	};

	const getAudio = (type: 'music' | 'sound' | 'voice', src: string) => {
		const kind = type === 'voice' ? 'voices' : type;
		const cached = store[kind][src];

		if (cached) return cached;

		const audio = createWebAudio({
			src,
			volume: getVolume(type),
			pauseOnBlur: true,
		});

		store[kind][src] = audio;

		return audio;
	};

	let unsubscribe = noop;

	const context: AudioContext = {
		music(src, method) {
			const resource = getAudio(method, src);

			this.start();

			return {
				pause() {
					resource.pause();
				},
				play(loop) {
					resource.loop = loop;
					resource.play();
				},
				stop() {
					resource.stop();
				},
			} satisfies AudioHandle;
		},
		voice(source) {
			this.start();
			this.voiceStop();

			const resource = (store.voice = getAudio('voice', source));

			resource.play();
		},
		voiceStop() {
			if (!store.voice) return;

			store.voice.stop();
			store.voice = undefined;
		},
		start() {
			if (unsubscribe !== noop) return;

			/**
			 * Subscribe for volume changes in settings
			 */
			unsubscribe = storageData.subscribe(() => {
				for (const type of ['music', 'sound', 'voice'] as const) {
					const volume = getVolume(type);

					if (type === 'music' || type === 'sound') {
						for (const audio of Object.values(store[type])) {
							if (!audio) continue;

							audio.volume = volume;
						}
					}

					if (type === 'voice' && store.voice) {
						store.voice.volume = volume;
					}
				}
			});
		},
		clear() {
			const musics = Object.values(store.music);
			const sounds = Object.values(store.sound);

			for (const music of [...musics, ...sounds]) {
				// todo: при переходе в настройки для музыки не делать бы stop, а делать pause
				music?.stop();
			}

			this.voiceStop();
		},
		destroy() {
			unsubscribe();
			this.clear();

			unsubscribe = noop;
		},
	};

	/**
	 * Used in clear action when audio should be cleared
	 * @param keepAudio Passed from Clear Action
	 */
	const clear = (keepAudio: KeepAudio) => {
		context.voiceStop();

		const musics = Object.entries(store.music)
			.filter(([name]) => !keepAudio.music.has(name))
			.map(([_, a]) => a);
		const sounds = Object.entries(store.sound)
			.filter(([name]) => !keepAudio.sounds.has(name))
			.map(([_, a]) => a);

		for (const music of [...musics, ...sounds]) {
			if (!music) continue;

			music.stop();
		}
	};

	return {
		context,

		clear,

		getVolume,
		getAudio,
	};
};

const createAudioMisc = () => {
	const misc: AudioMisc = {
		preloadAudioBlocking: async (src) => {
			await prefetchAudio(src);
		},
	};

	return misc;
};

export { createAudioMisc, createAudio };
