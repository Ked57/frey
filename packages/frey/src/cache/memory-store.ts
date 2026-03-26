import type { CacheStore } from "./types.js";

export const createInMemoryCacheStore = (): CacheStore => {
  const values = new Map<string, unknown>();

  return {
    get: async <T>(key: string): Promise<T | undefined> => {
      return values.get(key) as T | undefined;
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      values.set(key, value);
    },
    delete: async (key: string): Promise<void> => {
      values.delete(key);
    },
    clearByPrefix: async (prefix: string): Promise<void> => {
      for (const key of values.keys()) {
        if (key.startsWith(prefix)) {
          values.delete(key);
        }
      }
    },
  };
};
