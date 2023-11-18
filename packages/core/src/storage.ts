import type { StorageData } from './types';

interface LocalStorageStorageSettings {
	key: string;
}

interface Storage {
	get: () => Promise<StorageData>;
	set: (data: StorageData) => Promise<void>;
}

const localStorageStorage = (options: LocalStorageStorageSettings): Storage => {
	return {
		async get() {
			const fallback = { saves: [], data: {}, meta: [] };

			try {
				const value = localStorage.getItem(options.key);

				return value ? JSON.parse(value) : fallback;
			} catch {
				return fallback
			}
		},
		async set(data) {
			try {
				localStorage.setItem(options.key, JSON.stringify(data));
			} catch {}
		},
	};
};

export type { Storage };
export { localStorageStorage };
