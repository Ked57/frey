import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import { parseParams } from "../helpers/parse-params.js";
import { zodToOpenAPI, generateQuerySchema } from "../helpers/zod-to-openapi.js";
import { getReadErrorResponses } from "../helpers/error-schemas.js";

export const registerFindAllRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
) => {
  server.get(`/${entity.name}`, {
    schema: {
      summary: `Get all ${entity.name}s`,
      description: `Retrieve a list of ${entity.name}s with optional filtering, sorting, and pagination`,
      tags: [entity.name],
      querystring: generateQuerySchema(entity),
      response: {
        200: {
          type: "array",
          items: zodToOpenAPI(entity.schema),
          description: `List of ${entity.name}s`,
        },
        ...getReadErrorResponses(),
      },
    },
  }, async (request, reply) => {
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
