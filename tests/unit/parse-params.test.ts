import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseParams } from "../../src/helpers/parse-params.ts";
import { defineEntity } from "../../src/entity.ts";

describe("parseParams", () => {
  // Create a test entity with various parameter types
  const testEntity = defineEntity({
    name: "users",
    schema: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      age: z.number(),
      active: z.boolean(),
    }),
    customId: "userId",
    findAll: async () => [],
  });

  describe("structured query parameters", () => {
    it("should parse filters correctly", () => {
      const params = {
        filters: ["name", "email"],
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        filters: ["name", "email"],
      });
    });

    it("should parse order parameters correctly", () => {
      const params = {
        order: ["name", "-age"],
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        order: ["name", "-age"],
      });
    });

    it("should parse search parameter correctly", () => {
      const params = {
        search: "john",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        search: "john",
      });
    });

    it("should parse pagination parameters correctly", () => {
      const params = {
        limit: 10,
        offset: 20,
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        limit: 10,
        offset: 20,
      });
    });

    it("should parse complete query parameters", () => {
      const params = {
        filters: ["name", "email"],
        order: ["-age"],
        search: "john",
        limit: 10,
        offset: 0,
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        filters: ["name", "email"],
        order: ["-age"],
        search: "john",
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("flexible parameters", () => {
    it("should accept any parameters when not using structured format", () => {
      const params = {
        customField: "value",
        anotherParam: "123",
        showTerminated: "false",
        status: "to_configure",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        customField: "value",
        anotherParam: 123,
        showTerminated: false,
        status: "to_configure",
      });
    });
  });

  describe("intelligent type parsing", () => {
    it("should parse boolean strings correctly", () => {
      const params = {
        active: "true",
        verified: "false",
        enabled: true,
        disabled: false,
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        active: true,
        verified: false,
        enabled: true,
        disabled: false,
      });
    });

    it("should parse numeric strings correctly", () => {
      const params = {
        age: "25",
        count: "0",
        negative: "-10",
        decimal: "3.14",
        negativeDecimal: "-2.5",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        age: 25,
        count: 0,
        negative: -10,
        decimal: 3.14,
        negativeDecimal: -2.5,
      });
    });

    it("should parse undefined correctly", () => {
      const params = {
        undefinedValue: "undefined",
        emptyString: "",
        actualUndefined: undefined,
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        undefinedValue: undefined,
        emptyString: undefined,
        actualUndefined: undefined,
      });
    });

    it("should keep non-numeric strings as strings", () => {
      const params = {
        name: "John",
        email: "john@example.com",
        mixed: "123abc",
        special: "hello-world",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
        mixed: "123abc",
        special: "hello-world",
      });
    });
  });

  describe("ID-specific parameter parsing", () => {
    it("should include custom ID field when isIdSpecific is true", () => {
      const params = {
        userId: "123",
        name: "John",
      };

      const result = parseParams({
        params,
        entity: testEntity,
        isIdSpecific: true,
      });

      expect(result).toEqual({
        userId: 123,
        name: "John",
      });
    });

    it("should not include ID field when isIdSpecific is false", () => {
      const params = {
        name: "John",
      };

      const result = parseParams({
        params,
        entity: testEntity,
        isIdSpecific: false,
      });

      expect(result).toEqual({
        name: "John",
      });
    });

    it("should not include ID field when isIdSpecific is undefined", () => {
      const params = {
        name: "John",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        name: "John",
      });
    });

    it("should use default 'id' field when customId is not set", () => {
      const entityWithoutCustomId = defineEntity({
        name: "posts",
        schema: z.object({
          id: z.string(),
          title: z.string(),
        }),
        findAll: async () => [],
      });

      const params = {
        id: "456",
        title: "Test Post",
      };

      const result = parseParams({
        params,
        entity: entityWithoutCustomId,
        isIdSpecific: true,
      });

      expect(result).toEqual({
        id: 456,
        title: "Test Post",
      });
    });
  });

  describe("validation errors", () => {
    it("should accept any parameters without validation", () => {
      const params = {
        filters: ["invalidField", "name"],
        order: ["name", "-invalidField"],
        limit: -1,
        offset: -1,
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        filters: ["invalidField", "name"],
        order: ["name", "-invalidField"],
        limit: -1,
        offset: -1,
      });
    });

    it("should throw ZodError when required ID is missing in ID-specific mode", () => {
      const params = {
        name: "John",
      };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
          isIdSpecific: true,
        });
      }).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty params object", () => {
      const params = {};

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({});
    });

    it("should handle entity with no parameter configurations", () => {
      const minimalEntity = defineEntity({
        name: "minimal",
        schema: z.object({
          id: z.string(),
          value: z.string(),
        }),
        findAll: async () => [],
      });

      const params = {};

      const result = parseParams({
        params,
        entity: minimalEntity,
      });

      expect(result).toEqual({});
    });

    it("should handle entity with any parameters", () => {
      const simpleEntity = defineEntity({
        name: "simple",
        schema: z.object({
          id: z.string(),
          name: z.string(),
        }),
        findAll: async () => [],
      });

      const params = {
        name: "test",
        customField: "value",
        anotherParam: "123",
      };

      const result = parseParams({
        params,
        entity: simpleEntity,
      });

      expect(result).toEqual({
        name: "test",
        customField: "value",
        anotherParam: 123,
      });
    });
  });

  describe("security measures", () => {
    it("should reject parameter keys that are too long", () => {
      const longKey = "a".repeat(101);
      const params = { [longKey]: "value" };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
        });
      }).toThrow("is too long");
    });

    it("should reject parameter keys with invalid characters", () => {
      const params = {
        "invalid@key": "value",
        "key with spaces": "value",
        "key.with.dots": "value",
      };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
        });
      }).toThrow("contains invalid characters");
    });

    it("should reject parameter values that are too long", () => {
      const longValue = "a".repeat(10001);
      const params = { longParam: longValue };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
        });
      }).toThrow("value is too long");
    });

    it("should sanitize XSS attempts in string values", () => {
      const params = {
        script: "<script>alert('xss')</script>",
        onclick: "onclick=alert('xss')",
        javascript: "javascript:alert('xss')",
        normal: "normal value",
      };

      const result = parseParams({
        params,
        entity: testEntity,
      });

      expect(result).toEqual({
        script: "scriptalert('xss')/script",
        onclick: "alert('xss')",
        javascript: "alert('xss')",
        normal: "normal value",
      });
    });

    it("should reject arrays that are too long", () => {
      const longArray = new Array(101).fill("item");
      const params = { items: longArray };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
        });
      }).toThrow("array is too long");
    });

    it("should reject non-finite numbers", () => {
      const params = {
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN,
      };

      expect(() => {
        parseParams({
          params,
          entity: testEntity,
        });
      }).toThrow("number is not finite");
    });
  });
});
