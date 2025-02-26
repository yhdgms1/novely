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
	let started = false;

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
		});

		store[kind][src] = audio;

		return audio;
	};

	const cleanup = new Set<() => void>();

	let voiceCleanup = noop;

	const context: AudioContext = {
		music(src, paused, method) {
			const resource = getAudio(method, src);

			this.start();

			const unsubscribe = paused.subscribe((paused) => {
				if (paused) {
					resource.pause();
				} else {
					resource.play();
				}
			});

			cleanup.add(unsubscribe);

			return {
				pause() {
					resource.pause();
				},
				play(loop) {
					// todo: do audio better (again)
					if (resource.playing) {
						resource.volume = getVolume(method);
						resource.loop = loop;

						return;
					}

					resource.reset().then(() => {
						resource.volume = getVolume(method);
						resource.loop = loop;
						resource.play();
					});
				},
				stop() {
					resource.stop();
				},
			} satisfies AudioHandle;
		},
		voice(source, paused) {
			this.start();
			this.voiceStop();

			const resource = (store.voice = getAudio('voice', source));

			resource.volume = getVolume('voice');
			resource.play();

			voiceCleanup = paused.subscribe((paused) => {
				if (paused) {
					resource.pause();
				} else {
					resource.play();
				}
			});
		},
		voiceStop() {
			if (!store.voice) return;

			store.voice.stop();
			voiceCleanup();
			store.voice = undefined;
			voiceCleanup = noop;
		},
		start() {
			if (started) return;

			started = true;

			const unsubscribe = storageData.subscribe(() => {
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

			cleanup.add(unsubscribe);
		},
		clear() {
			const musics = Object.values(store.music);
			const sounds = Object.values(store.sound);

			for (const music of [...musics, ...sounds]) {
				if (!music) continue;

				// todo: when going to setting menu `pause` instead of `stop`
				music.stop();
			}

			this.voiceStop();
		},
		destroy() {
			cleanup.forEach((fn) => fn());
			this.clear();

			started = false;
		},
	};

	/**
	 * Used in clear action when audio should be cleared
	 * @param keepAudio Passed from Clear Action
	 */
	const clear = (keepAudio: KeepAudio) => {
		context.voiceStop();

		const entries = [
			[store.music, keepAudio.music],
			[store.sound, keepAudio.sounds],
		] as const;

		const clearEntries = entries.flatMap(([incoming, keep]) => {
			return Object.entries(incoming)
				.filter(([name]) => !keep.has(name))
				.map(([_, a]) => a);
		});

		for (const music of clearEntries) {
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
