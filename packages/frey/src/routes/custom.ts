import { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { Entity } from "../entity.js";
import type { AuthConfig } from "../auth/types.js";
import { getCustomRouteErrorResponses } from "../helpers/error-schemas.js";
import { getAuthErrorResponses } from "../helpers/auth-error-schemas.js";
import { createRouteAuthMiddleware } from "../auth/middleware.js";

export const registerCustomRoutes = (
  server: FastifyInstance,
  entity: Entity<z.ZodObject<Record<string, any>>>,
  globalAuth?: AuthConfig,
) => {
  if (!entity.customRoutes || entity.customRoutes.length === 0) {
    return;
  }

  entity.customRoutes.forEach((customRoute) => {
    const fullPath = `/${entity.name}${customRoute.path}`;

    server.log.info(
      `Registering custom route: ${customRoute.method} ${fullPath}`,
    );

    // Use type assertion to handle the dynamic method call
    const method = customRoute.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "head"
      | "options";

    // Prepare preHandlers for authentication
    const preHandlers = [];
    
    // Add authentication middleware if custom route requires auth
    // Default to true when auth is enabled globally, unless explicitly set to false
    const authConfig = customRoute.auth || {};
    const requiresAuth = globalAuth?.enabled && authConfig.requireAuth !== false;
    
    if (requiresAuth) {
      preHandlers.push(createRouteAuthMiddleware(authConfig, globalAuth));
    }

    // Prepare response schema
    const responseSchema = {
      200: {
        type: "object",
        description: "Custom route response",
        additionalProperties: true,
      },
      ...getCustomRouteErrorResponses(),
    };

    // Add auth error responses if custom route requires auth
    if (requiresAuth) {
      Object.assign(responseSchema, getAuthErrorResponses());
    }

    // Merge custom error responses if provided
    if (customRoute.customErrors) {
      Object.assign(responseSchema, customRoute.customErrors);
    }

    const routeOptions: any = {
      schema: {
        summary: `Custom ${customRoute.method} route for ${entity.name}`,
        description: `Custom route: ${customRoute.method} ${fullPath}`,
        tags: [entity.name, "custom"],
        response: responseSchema,
      },
    };

    if (preHandlers.length > 0) {
      routeOptions.preHandler = preHandlers;
    }

    (server[method] as any)(fullPath, routeOptions, async (request: any, reply: any) => {
      try {
        await customRoute.registerRoute(request, reply, {
          server,
          entity,
        });
      } catch (error: any) {
        server.log.error(`Error in custom route ${fullPath}:`, error);
        reply.status(500).send({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  });
};
