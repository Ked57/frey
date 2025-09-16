import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import { parseParams } from "../helpers/parse-params.js";

export const registerFindAllRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
) => {
  server.get(`/${entity.name}`, async (request, reply) => {
    try {
      const params = parseParams({
        params: request.query,
        entity,
        isIdSpecific: false,
      });

      const result = await entity.findAll(params, {
        request,
        server,
      });
      reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("parameter")) {
        reply.status(400).send({
          error: "Invalid query parameters",
          message: error.message,
        });
        return;
      }

      if (error instanceof z.ZodError) {
        reply.status(400).send({
          error: "Invalid query parameters",
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
