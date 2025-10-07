import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import type { AuthConfig } from "../auth/types.js";
import { parseParams } from "../helpers/parse-params.js";
import { zodToOpenAPI } from "../helpers/zod-to-openapi.js";
import { getWriteErrorResponses } from "../helpers/error-schemas.js";
import { getAuthErrorResponses } from "../helpers/auth-error-schemas.js";
import { createRouteAuthMiddleware } from "../auth/middleware.js";

export const registerCreateRoute = (
  server: FastifyInstance,
  entity: Entity<any>,
  globalAuth?: AuthConfig,
) => {
  if (!entity.create) {
    server.log.warn(
      `Entity ${entity.name} does not have a create function - skipping POST route`,
    );
    return;
  }

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
      ...zodToOpenAPI(entity.schema),
      description: `The created ${entity.name}`,
    },
    ...getWriteErrorResponses(),
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
      summary: `Create a new ${entity.name}`,
      description: `Create a new ${entity.name} with the provided data`,
      tags: [entity.name],
      body: zodToOpenAPI(entity.schema),
      response: responseSchema,
    },
  };

  if (preHandlers.length > 0) {
    routeOptions.preHandler = preHandlers;
  }

  server.post(`/${entity.name}`, routeOptions, async (request, reply) => {
    try {
      const params = parseParams({
        params: request.body,
        entity,
        isIdSpecific: false,
      });

      const result = await entity.create!(params as any, {
        request,
        server,
        auth: (request as any).auth,
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
