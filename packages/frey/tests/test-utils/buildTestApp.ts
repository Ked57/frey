import { type FastifyInstance } from "fastify";
import Fastify from "fastify";
import { registerFrey } from "../../src/main.js";
import type { ServerOptions } from "../../src/main.js";
import type { Entity } from "../../src/entity.js";
import { z } from "zod";

export type BuildTestAppResult<T extends readonly Entity<z.ZodObject<any>>[]> =
  {
    app: FastifyInstance;
    entities: T;
  };

/**
 * Registration-only test app builder.
 *
 * - Does NOT call `app.listen()`
 * - Uses `registerFrey()` so tests exercise the v3 "no side effects" contract.
 */
export const buildTestApp = async <
  T extends readonly Entity<z.ZodObject<any>>[],
>(
  opts: Omit<ServerOptions<T>, "port" | "host">,
): Promise<BuildTestAppResult<T>> => {
  const app = Fastify({ logger: false });

  // Ensure types remain aligned; `ServerOptions` requires `entities`.
  const serverOptions = {
    entities: opts.entities,
    swagger: opts.swagger,
    auth: opts.auth,
    cqrs: opts.cqrs,
    cache: opts.cache,
    cors: opts.cors,
  } satisfies ServerOptions<T>;

  await registerFrey(app, serverOptions);
  await app.ready();

  return { app, entities: opts.entities };
};

