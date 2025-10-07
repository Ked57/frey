import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import {
  createRbacMiddleware,
  checkRbacPermission,
  getDefaultRoles,
} from "../../src/auth/rbac.js";
import { FREY_ROLES } from "../../src/auth/types.js";
import type { User } from "../../src/auth/types.js";
import type { Context } from "../../src/entity.js";

describe("RBAC System", () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe("Default Roles", () => {
    it("should have correct default role permissions", () => {
      const defaultRoles = getDefaultRoles();

      expect(defaultRoles.user).toEqual({
        create: "Own",
        read: "All",
        update: "Own",
        delete: "Own",
      });

      expect(defaultRoles.admin).toEqual({
        create: "All",
        read: "All",
        update: "All",
        delete: "All",
      });
    });
  });

  describe("Permission Checking", () => {
    const mockUser = {
      id: "user123",
      email: "test@example.com",
      role: FREY_ROLES.USER,
    } satisfies User;

    const mockAdmin = {
      id: "admin123",
      email: "admin@example.com",
      role: FREY_ROLES.ADMIN,
    } satisfies User;

    const mockContext: Context = {
      request: {} as any,
      server: {} as any,
      auth: {
        user: mockUser,
        isAuthenticated: true,
      },
    };

    it("should allow admin to perform all operations", async () => {
      const entityData = { id: "entity123", ownerId: "user123" };

      const canRead = await checkRbacPermission(
        mockAdmin,
        "testEntity",
        "read",
        entityData,
        mockContext,
      );

      const canUpdate = await checkRbacPermission(
        mockAdmin,
        "testEntity",
        "update",
        entityData,
        mockContext,
      );

      expect(canRead).toBe(true);
      expect(canUpdate).toBe(true);
    });

    it("should allow user to read all entities", async () => {
      const entityData = { id: "entity123", ownerId: "otheruser" };

      const canRead = await checkRbacPermission(
        mockUser,
        "testEntity",
        "read",
        entityData,
        mockContext,
      );

      expect(canRead).toBe(true);
    });

    it("should allow user to update own entities", async () => {
      // Entity with ownership field matching user ID
      const ownEntity = { id: "entity123", ownerId: "user123" };
      const otherEntity = { id: "entity456", ownerId: "otheruser" };

      const canUpdateOwn = await checkRbacPermission(
        mockUser,
        "testEntity",
        "update",
        ownEntity,
        mockContext,
        { ownerField: "ownerId" }, // Specify custom ownership field
      );

      const canUpdateOther = await checkRbacPermission(
        mockUser,
        "testEntity",
        "update",
        otherEntity,
        mockContext,
        { ownerField: "ownerId" }, // Specify custom ownership field
      );

      expect(canUpdateOwn).toBe(true);
      expect(canUpdateOther).toBe(false);
    });

    it("should handle role-specific entity operations", async () => {
      const entityData = { id: "entity123", ownerId: "user123" };

      // Test with entity that has role-specific operations
      const entityRbacConfig = {
        ownerField: "ownerId",
        operations: {
          admin: {
            delete: "All", // Admin can delete any user
          },
          user: {
            delete: "Own", // User can only delete their own users
          },
        },
      } as const;

      // Admin should be able to delete any entity
      const adminCanDelete = await checkRbacPermission(
        mockAdmin,
        "testEntity",
        "delete",
        entityData,
        mockContext,
        entityRbacConfig,
      );

      // User should be able to delete their own entity
      const userCanDeleteOwn = await checkRbacPermission(
        mockUser,
        "testEntity",
        "delete",
        entityData,
        mockContext,
        entityRbacConfig,
      );

      // User should not be able to delete other's entity
      const otherEntity = { id: "entity456", ownerId: "otheruser" };
      const userCanDeleteOther = await checkRbacPermission(
        mockUser,
        "testEntity",
        "delete",
        otherEntity,
        mockContext,
        entityRbacConfig,
      );

      expect(adminCanDelete).toBe(true);
      expect(userCanDeleteOwn).toBe(true);
      expect(userCanDeleteOther).toBe(false);
    });

    it("should handle custom ownership field", async () => {
      const entityData = { id: "entity123", userId: "user123" }; // Different field name

      const canUpdate = await checkRbacPermission(
        mockUser,
        "testEntity",
        "update",
        entityData,
        mockContext,
        { ownerField: "userId" }, // Custom ownership field
      );

      expect(canUpdate).toBe(true);
    });
  });

  describe("RBAC Middleware", () => {
    it("should create RBAC middleware function", () => {
      const middleware = createRbacMiddleware(
        "testEntity",
        "read",
        undefined,
        undefined,
      );

      expect(typeof middleware).toBe("function");
    });
  });

  describe("Integration with Entity", () => {
    it("should work with entity configuration", async () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum([FREY_ROLES.ADMIN, FREY_ROLES.USER]),
      });

      const userEntity = defineEntity({
        name: "user",
        schema: userSchema,
        rbac: {
          ownerField: "id",
          operations: {
            admin: {
              delete: "All", // Only admins can delete users
            },
          },
        },
        findAll: async (params, { auth }) => {
          return [
            { id: "1", name: "John", email: "john@example.com", role: FREY_ROLES.USER },
          ];
        },
        create: async (params, { auth }) => {
          return {
            id: "2",
            name: "Jane",
            email: "jane@example.com",
            role: FREY_ROLES.USER,
          };
        },
        update: async (params, { auth }) => {
          return {
            id: "1",
            name: "John Updated",
            email: "john@example.com",
            role: FREY_ROLES.USER,
          };
        },
        delete: async (params, { auth }) => {
          return;
        },
      });

      // Test that entity has RBAC configuration
      expect(userEntity.rbac).toBeDefined();
      expect(userEntity.rbac?.ownerField).toBe("id");
      expect(userEntity.rbac?.operations?.admin?.delete).toBe("All");
    });
  });
});
