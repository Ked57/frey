import { z } from "zod";
import Fastify from "fastify";
import { defineEntity } from "./src/entity.js";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const userEntity = defineEntity({
  name: "user",
  schema: userSchema,
  customId: "id",
  findAll: async (params, { auth }) => {
    console.log("findAll called with auth:", auth);
    return [{ id: "1", name: "Test" }];
  },
});

const fastify = Fastify({ logger: true });

// Simple route registration with auth
fastify.register(async function(fastify) {
  const preHandlers = [];
  
  // Mock auth middleware
  preHandlers.push(async (request: any, reply: any) => {
    console.log("Auth middleware running");
    reply.status(401).send({ error: "Unauthorized" });
    return reply.sent = true;
  });

  fastify.get("/user", { preHandler: preHandlers }, async (request, reply) => {
    console.log("Handler called");
    reply.send({ message: "Success" });
  });
});

fastify.listen({ port: 3001 }).then(() => {
  console.log("Server started");
});
