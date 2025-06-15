import type { StorageData } from './types';

type StorageAdapter = {
	get: () => Promise<StorageData>;
	set: (data: StorageData) => Promise<void>;
};

type StorageAdapterLocalOptions = {
	key: string;
};

/**
 * Stores data in localStorage
 */
const storageAdapterLocal = ({ key }: StorageAdapterLocalOptions): StorageAdapter => {
	return {
		async get() {
			const fallback = { saves: [], data: {}, meta: [] };

			try {
				const value = localStorage.getItem(key);

				return value ? JSON.parse(value) : fallback;
			} catch {
				return fallback;
			}
		},
		async set(data) {
			try {
				localStorage.setItem(key, JSON.stringify(data));
			} catch {}
		},
	};
};

export type { StorageAdapter };
export { storageAdapterLocal };
