import type { Save } from './types'

interface LocalStorageStorageSettings {
  key: string
}

interface Storage {
  get: () => Promise<Save[]>;
  set: (data: Save[]) => Promise<void>;
}

const localStorageStorage = (options: LocalStorageStorageSettings): Storage => {
  return {
    async get() {
      const value = localStorage.getItem(options.key);

      return value ? JSON.parse(value) : [];
    },
    async set(data) {
      localStorage.setItem(options.key, JSON.stringify(data));
    }
  }
}

export type { Storage }
export { localStorageStorage }