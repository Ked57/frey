import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import { parseParams } from "../helpers/parse-params.ts";

export const registerCreateRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
) => {
  if (!entity.create) {
    server.log.warn(
      `Entity ${entity.name} does not have a create function - skipping POST route`,
    );
    return;
  }

  server.post(`/${entity.name}`, async (request, reply) => {
    try {
      const params = parseParams({
        params: request.body,
        entity,
        isIdSpecific: false,
      });

      const result = await entity.create!(params as any, {
        request,
        server,
      });
      reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("parameter")) {
        reply.status(400).send({
          error: "Invalid request body",
          message: error.message,
        });
        return;
      }

      if (error instanceof z.ZodError) {
        reply.status(400).send({
          error: "Invalid request body",
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
  });
};
