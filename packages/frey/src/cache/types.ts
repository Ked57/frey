export type CacheStore = {
  get: <T = unknown>(key: string) => Promise<T | undefined> | T | undefined;
  set: <T = unknown>(
    key: string,
    value: T,
    ttlMs?: number,
  ) => Promise<void> | void;
  delete: (key: string) => Promise<void> | void;
  clearByPrefix: (prefix: string) => Promise<void> | void;
};

export type CacheConfig = {
  enabled?: boolean;
  ttlMs?: number;
  keyPrefix?: string;
  store?: CacheStore;
};

