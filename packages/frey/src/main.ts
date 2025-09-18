import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "./entity.js";
import {
  registerFindAllRoute,
  registerFindOneRoute,
  registerCreateRoute,
  registerUpdateRoute,
  registerDeleteRoute,
  registerCustomRoutes,
} from "./routes/index.js";

export type ServerOptions<
  T extends readonly Entity<z.ZodObject<any>>[] = readonly Entity<
    z.ZodObject<any>
  >[],
> = {
  port?: number;
  host?: string;
  entities: T;
};

let server: FastifyInstance;
let entities: Map<string, Entity<z.ZodObject<any>>>;

export const startServer = async <
  T extends readonly Entity<z.ZodObject<any>>[],
>(
  fastify: FastifyInstance,
  opts: ServerOptions<T>,
) => {
  server = fastify;
  entities = new Map();
  opts.entities.forEach((entity) => {
    entities.set(entity.name, entity);

    // Register all CRUD routes
    registerFindAllRoute(server, entity);
    registerFindOneRoute(server, entity);
    registerCreateRoute(server, entity);
    registerUpdateRoute(server, entity);
    registerDeleteRoute(server, entity);

    // Register custom routes
    registerCustomRoutes(server, entity);
  });

  try {
    await fastify.listen({ port: opts.port ?? 3000, host: opts.host });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
