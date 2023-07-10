import type { StorageData } from './types'

interface LocalStorageStorageSettings {
  key: string
}

interface Storage {
  get: () => Promise<StorageData>;
  set: (data: StorageData) => Promise<void>;
}

const localStorageStorage = (options: LocalStorageStorageSettings): Storage => {
  return {
    async get() {
      const value = localStorage.getItem(options.key);

      return value ? JSON.parse(value) : { saves: [], data: {}, meta: [] };
    },
    async set(data) {
      localStorage.setItem(options.key, JSON.stringify(data));
    }
  }
}

export type { Storage }
export { localStorageStorage }