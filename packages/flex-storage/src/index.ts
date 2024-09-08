import type { StorageData, NovelyStorage } from '@novely/core';
import type { Adapter, AdapterLocalStorageOptions, Options } from './types'
import { compress, decompress } from 'lz-string';
import { serializeAsync, deserialize } from 'seroval';

const getDefault = (): StorageData => {
  /**
   * There are missing fields, however, engine will set them
   */
  return {
    saves: [],
    data: {},
    meta: []
  } as unknown as StorageData;
}

const flexStorage = ({ adapter }: Options): NovelyStorage => {
  return {
    async get() {
      const value = await adapter.get();

      if (value === null) {
        return getDefault();
      }

      try {
        const decompressed = decompress(value);
        const deserialized = deserialize(decompressed);

        return deserialized as StorageData;
      } catch {
        return getDefault();
      }
    },
    async set(data) {
      try {
        const serialized = await serializeAsync(data);
        const compressed = compress(serialized);

        await adapter.set(compressed);
      } catch {}
    }
  }
}

const adapterLocalStorage = ({ key = 'flex-novely-storage' }: AdapterLocalStorageOptions = {}): Adapter => {
  return {
    async get() {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async set(data) {
      try {
        localStorage.setItem(key, data);
      } catch {}
    }
  }
}

export {
  flexStorage,
  adapterLocalStorage
}

export type {
  Adapter,
  Options,
  AdapterLocalStorageOptions
}
