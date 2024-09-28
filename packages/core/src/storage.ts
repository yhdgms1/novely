import type { StorageData } from './types';

type LocalStorageStorageSettings = {
	key: string;
};

type NovelyStorage = {
	get: () => Promise<StorageData>;
	set: (data: StorageData) => Promise<void>;
};

const localStorageStorage = (options: LocalStorageStorageSettings): NovelyStorage => {
	return {
		async get() {
			const fallback = { saves: [], data: {}, meta: [] };

			try {
				const value = localStorage.getItem(options.key);

				return value ? JSON.parse(value) : fallback;
			} catch {
				return fallback;
			}
		},
		async set(data) {
			try {
				localStorage.setItem(options.key, JSON.stringify(data));
			} catch {}
		},
	};
};

export type { NovelyStorage };
export { localStorageStorage };
