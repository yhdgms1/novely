interface LocalStorageStorageSettings {
  key: string
}

interface Storage {
  get: () => Promise<any>;
  set: (data: any) => Promise<any>;
}

const localStorageStorage = (options: LocalStorageStorageSettings): Storage => {
  return {
    async get() {
      const value = localStorage.getItem(options.key);

      return value ? JSON.parse(value) : value;
    },
    async set(data) {
      localStorage.setItem(options.key, JSON.stringify(data));
    }
  }
}

export type { Storage }
export { localStorageStorage }