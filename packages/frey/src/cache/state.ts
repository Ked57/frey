import type { FastifyInstance } from "fastify";
import type { CacheConfig } from "./types.js";

const cacheByServer = new WeakMap<FastifyInstance, CacheConfig>();

export const setCacheConfig = (
  server: FastifyInstance,
  next: CacheConfig,
) => {
  cacheByServer.set(server, next);
};

export const getCacheConfig = (server: FastifyInstance): CacheConfig => {
  return cacheByServer.get(server) ?? { enabled: false };
};

// Canonical list cache key builder used by both reads and invalidation.
export const buildEntityListCacheKey = (
  keyPrefix: string,
  entityName: string,
  params: unknown,
): string => {
  return `${keyPrefix}:${entityName}:list:${JSON.stringify(params)}`;
};

export const invalidateEntityListCache = async (
  server: FastifyInstance,
  entityName: string,
): Promise<void> => {
  const cacheConfig = getCacheConfig(server);
  if (!cacheConfig.enabled || !cacheConfig.store) return;
  const keyPrefix = cacheConfig.keyPrefix ?? "frey:cache";
  await cacheConfig.store.clearByPrefix(`${keyPrefix}:${entityName}:list:`);
};

export const invalidatePrefixedCache = async (
  server: FastifyInstance,
  prefix: string,
): Promise<void> => {
  const cacheConfig = getCacheConfig(server);
  if (!cacheConfig.enabled || !cacheConfig.store) return;
  await cacheConfig.store.clearByPrefix(prefix);
};

