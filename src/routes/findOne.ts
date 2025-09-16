import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import { parseParams } from "../helpers/parse-params.ts";

export const registerFindOneRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
) => {
  if (!entity.findOne) {
    server.log.error(`Entity ${entity.name} does not have a findOne function`);
    return;
  }

  server.get(
    `/${entity.name}/:${entity.customId ?? "id"}`,
    async (request, reply) => {
      try {
        const params = parseParams({
          params: request.params,
          entity,
          isIdSpecific: true,
        });

        const idField = entity.customId ?? "id";
        const idValue = params[idField];

        const result = await entity.findOne!({ id: idValue } as any, {
          request,
          server,
        });
        reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes("parameter")) {
          reply.status(400).send({
            error: "Invalid URL parameters",
            message: error.message,
          });
          return;
        }

        if (error instanceof z.ZodError) {
          reply.status(400).send({
            error: "Invalid URL parameters",
            details: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          });
          return;
        }

        server.log.error(error);
        reply.status(500).send({
          error: "Internal server error",
        });
      }
    },
  );
};
