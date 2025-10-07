import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineEntity } from "../../src/entity.js";
import { FREY_ROLES, createRoleConstants, COMMON_ROLES } from "../../src/auth/types.js";

describe("Role Constants", () => {
  describe("Basic FREY_ROLES", () => {
    it("should have default roles", () => {
      expect(FREY_ROLES.ADMIN).toBe("admin");
      expect(FREY_ROLES.USER).toBe("user");
    });
  });

  describe("COMMON_ROLES", () => {
    it("should have common custom roles", () => {
      expect(COMMON_ROLES.MODERATOR).toBe("moderator");
      expect(COMMON_ROLES.GUEST).toBe("guest");
      expect(COMMON_ROLES.EDITOR).toBe("editor");
      expect(COMMON_ROLES.VIEWER).toBe("viewer");
    });
  });

  describe("createRoleConstants", () => {
    it("should extend FREY_ROLES with custom roles", () => {
      const customRoles = {
        MODERATOR: "moderator",
        GUEST: "guest",
      };

      const extendedRoles = createRoleConstants(customRoles);

      // Should have default roles
      expect(extendedRoles.ADMIN).toBe("admin");
      expect(extendedRoles.USER).toBe("user");

      // Should have custom roles
      expect(extendedRoles.MODERATOR).toBe("moderator");
      expect(extendedRoles.GUEST).toBe("guest");
    });

    it("should work with Zod schemas", () => {
      const customRoles = {
        MODERATOR: "moderator",
        GUEST: "guest",
      };

      const extendedRoles = createRoleConstants(customRoles);

      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum([
          FREY_ROLES.ADMIN,
          FREY_ROLES.USER,
          extendedRoles.MODERATOR,
          extendedRoles.GUEST,
        ]),
      });

      // Test that schema accepts all role values
      const validUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: extendedRoles.MODERATOR,
      };

      expect(() => userSchema.parse(validUser)).not.toThrow();
    });

    it("should work with entity RBAC configuration", () => {
      const customRoles = {
        MODERATOR: "moderator",
        GUEST: "guest",
      };

      const extendedRoles = createRoleConstants(customRoles);

      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum([
          FREY_ROLES.ADMIN,
          FREY_ROLES.USER,
          extendedRoles.MODERATOR,
          extendedRoles.GUEST,
        ]),
      });

      const userEntity = defineEntity({
        name: "user",
        schema: userSchema,
        rbac: {
          ownerField: "id",
          operations: {
            [FREY_ROLES.ADMIN]: {
              delete: "All",
            },
            [FREY_ROLES.USER]: {
              delete: "Own",
            },
            [extendedRoles.MODERATOR]: {
              delete: "All", // Moderators can delete any user
            },
            [extendedRoles.GUEST]: {
              read: "All", // Guests can only read
            },
          },
        },
        findAll: async () => [],
        create: async () => ({ id: "1", name: "Test", email: "test@example.com", role: FREY_ROLES.USER }),
        update: async () => ({ id: "1", name: "Test", email: "test@example.com", role: FREY_ROLES.USER }),
        delete: async () => {},
      });

      // Test that entity has RBAC configuration for all roles
      expect(userEntity.rbac?.operations?.[FREY_ROLES.ADMIN]?.delete).toBe("All");
      expect(userEntity.rbac?.operations?.[FREY_ROLES.USER]?.delete).toBe("Own");
      expect(userEntity.rbac?.operations?.[extendedRoles.MODERATOR]?.delete).toBe("All");
      expect(userEntity.rbac?.operations?.[extendedRoles.GUEST]?.read).toBe("All");
    });
  });

  describe("Real-world usage example", () => {
    it("should demonstrate how to use custom roles in a real application", () => {
      // Define your application's custom roles
      const appRoles = {
        MODERATOR: "moderator",
        GUEST: "guest",
        EDITOR: "editor",
      };

      // Create extended role constants
      const ROLES = createRoleConstants(appRoles);

      // Use in schema
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum([
          ROLES.ADMIN,    // "admin"
          ROLES.USER,     // "user"
          ROLES.MODERATOR, // "moderator"
          ROLES.GUEST,    // "guest"
          ROLES.EDITOR,   // "editor"
        ]),
      });

      // Use in RBAC configuration
      const userEntity = defineEntity({
        name: "user",
        schema: userSchema,
        rbac: {
          operations: {
            [ROLES.ADMIN]: { create: "All", read: "All", update: "All", delete: "All" },
            [ROLES.USER]: { create: "Own", read: "All", update: "Own", delete: "Own" },
            [ROLES.MODERATOR]: { create: "All", read: "All", update: "All", delete: "Own" },
            [ROLES.GUEST]: { read: "All" },
            [ROLES.EDITOR]: { create: "All", read: "All", update: "All", delete: "Own" },
          },
        },
        findAll: async () => [],
        create: async () => ({ id: "1", name: "Test", email: "test@example.com", role: ROLES.USER }),
        update: async () => ({ id: "1", name: "Test", email: "test@example.com", role: ROLES.USER }),
        delete: async () => {},
      });

      // Verify all roles are properly configured
      expect(userEntity.rbac?.operations?.[ROLES.ADMIN]).toBeDefined();
      expect(userEntity.rbac?.operations?.[ROLES.USER]).toBeDefined();
      expect(userEntity.rbac?.operations?.[ROLES.MODERATOR]).toBeDefined();
      expect(userEntity.rbac?.operations?.[ROLES.GUEST]).toBeDefined();
      expect(userEntity.rbac?.operations?.[ROLES.EDITOR]).toBeDefined();
    });
  });
});
