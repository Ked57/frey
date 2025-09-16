import { z } from "zod";
import Fastify from "fastify";
import { defineEntity } from "./src/entity.js";
import { startServer } from "./src/main.js";

const userSchema = z.object({
  uuid: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "uuid",
  customRoutes: [
    {
      path: "/mycustomroute",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        // entity.schema is now properly typed as userSchema
        reply.send({
          message: "Hello from custom route!",
          entityName: entity.name,
          timestamp: new Date().toISOString(),
        });
      },
    },
    {
      path: "/stats",
      method: "GET",
      registerRoute: async (request, reply, { server, entity }) => {
        reply.send({
          totalUsers: 42,
          activeUsers: 38,
          entityName: entity.name,
        });
      },
    },
  ],
  findAll: async (params, { request, server }) => {
    return [
      {
        uuid: crypto.randomUUID(),
        name: "John Doe",
        email: "john.doe@example.com",
        createdAt: new Date(),
      },
    ];
  },
  findOne: async (param, { request, server }) => {
    return {
      uuid: crypto.randomUUID(),
      name: "John Doe",
      email: "john.doe@example.com",
      createdAt: new Date(),
    };
  },
  // delete: (params: any, context: any) => {},
  // create: (params: any, context: any) => {},
  // update: (params: any, context: any) => {},
});

const fastify = Fastify({
  logger: true,
});

// Type information is now preserved - entities array maintains its specific types
startServer(fastify, {
  entities: [userEntity],
  // middlewares: [],
});
