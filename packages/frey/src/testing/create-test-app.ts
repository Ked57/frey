import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { registerFrey, type ServerOptions } from "../main.js";
import type { Entity } from "../entity.js";

export type CreateTestAppResult<T extends readonly Entity<z.ZodObject<any>>[]> =
  {
    app: FastifyInstance;
    entities: T;
  };

/**
 * Public registration-only app builder for tests.
 *
 * - Does NOT call `app.listen()`
 * - Uses `registerFrey()` to exercise framework registration behavior only
 */
export const createTestApp = async <
  T extends readonly Entity<z.ZodObject<any>>[],
>(
  opts: Omit<ServerOptions<T>, "port" | "host">,
): Promise<CreateTestAppResult<T>> => {
  const app = Fastify({ logger: false });
  await registerFrey(app, opts as ServerOptions<T>);
  await app.ready();
  return { app, entities: opts.entities };
};
