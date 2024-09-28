import type { createAudio } from 'simple-web-audio';

type AudioInstance = ReturnType<typeof createAudio>;

type AudioStore = {
	music: Partial<Record<string, AudioInstance>>;
	sound: Partial<Record<string, AudioInstance>>;
	voices: Partial<Record<string, AudioInstance>>;

	voice?: AudioInstance;
};

export type { AudioStore };
