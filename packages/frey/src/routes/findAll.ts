import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import type { AuthConfig } from "../auth/types.js";
import { parseParams } from "../helpers/parse-params.js";
import { zodToOpenAPI, generateQuerySchema } from "../helpers/zod-to-openapi.js";
import { getReadErrorResponses } from "../helpers/error-schemas.js";
import { getAuthErrorResponses } from "../helpers/auth-error-schemas.js";
import { createRouteAuthMiddleware } from "../auth/middleware.js";

export const registerFindAllRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
  globalAuth?: AuthConfig,
) => {
  // Prepare preHandlers for authentication
  const preHandlers = [];
  
  // Add authentication middleware if entity requires auth
  // Default to true when auth is enabled globally, unless explicitly set to false
  const authConfig = entity.auth || {};
  const requiresAuth = globalAuth?.enabled && authConfig.requireAuth !== false;
  
  if (requiresAuth) {
    preHandlers.push(createRouteAuthMiddleware(authConfig, globalAuth));
  }

  // Prepare response schema with auth errors if needed
  const responseSchema = {
    200: {
      type: "array",
      items: zodToOpenAPI(entity.schema),
      description: `List of ${entity.name}s`,
    },
    ...getReadErrorResponses(),
  };

  // Add auth error responses if entity requires auth
  if (requiresAuth) {
    Object.assign(responseSchema, getAuthErrorResponses());
  }

  // Merge custom error responses if provided
  if (entity.customErrors) {
    Object.assign(responseSchema, entity.customErrors);
  }

  const routeOptions: any = {
    schema: {
      summary: `Get all ${entity.name}s`,
      description: `Retrieve a list of ${entity.name}s with optional filtering, sorting, and pagination`,
      tags: [entity.name],
      querystring: generateQuerySchema(entity),
      response: responseSchema,
    },
  };

  if (preHandlers.length > 0) {
    routeOptions.preHandler = preHandlers;
  }

  server.get(`/${entity.name}`, routeOptions, async (request, reply) => {
    try {
      const params = parseParams({
        params: request.query,
        entity,
        isIdSpecific: false,
      });

      const result = await entity.findAll(params, {
        request,
        server,
        auth: (request as any).auth,
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
