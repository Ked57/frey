import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  Prettify,
  PrettyInfer,
  jsonSchema,
  type JsonSchema,
} from "../../src/helpers/types.ts";

describe("Helper Types and Utilities", () => {
  describe("Prettify Type", () => {
    it("should work with simple types", () => {
      type TestType = {
        id: string;
        name: string;
        nested: {
          value: number;
        };
      };

      type Prettified = Prettify<TestType>;

      // This is a compile-time test - if it compiles, the type works
      const test: Prettified = {
        id: "1",
        name: "test",
        nested: {
          value: 42,
        },
      };

      expect(test.id).toBe("1");
      expect(test.name).toBe("test");
      expect(test.nested.value).toBe(42);
    });

    it("should work with intersection types", () => {
      type Base = { id: string };
      type Extended = Base & { name: string };

      type Prettified = Prettify<Extended>;

      const test: Prettified = {
        id: "1",
        name: "test",
      };

      expect(test.id).toBe("1");
      expect(test.name).toBe("test");
    });
  });

  describe("PrettyInfer Type", () => {
    it("should work with Zod schemas", () => {
      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.date(),
      });

      type User = PrettyInfer<typeof userSchema>;

      const user: User = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
      };

      expect(user.id).toBe("1");
      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should work with nested Zod schemas", () => {
      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string(),
      });

      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        address: addressSchema,
      });

      type User = PrettyInfer<typeof userSchema>;

      const user: User = {
        id: "1",
        name: "John Doe",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
      };

      expect(user.address.street).toBe("123 Main St");
      expect(user.address.city).toBe("Anytown");
      expect(user.address.zipCode).toBe("12345");
    });
  });

  describe("jsonSchema", () => {
    it("should validate primitive values", () => {
      expect(jsonSchema.parse("string")).toBe("string");
      expect(jsonSchema.parse(42)).toBe(42);
      expect(jsonSchema.parse(true)).toBe(true);
      expect(jsonSchema.parse(null)).toBe(null);
    });

    it("should validate arrays", () => {
      const array = ["string", 42, true, null];
      expect(jsonSchema.parse(array)).toEqual(array);
    });

    it("should validate nested arrays", () => {
      const nestedArray = [
        ["string", 42],
        [true, null],
      ];
      expect(jsonSchema.parse(nestedArray)).toEqual(nestedArray);
    });

    it("should validate objects", () => {
      const obj = {
        string: "value",
        number: 42,
        boolean: true,
        nullValue: null,
      };
      expect(jsonSchema.parse(obj)).toEqual(obj);
    });

    it("should validate nested objects", () => {
      const nestedObj = {
        user: {
          id: "1",
          name: "John",
          settings: {
            theme: "dark",
            notifications: true,
          },
        },
        metadata: {
          createdAt: "2023-01-01",
          tags: ["important", "user"],
        },
      };
      expect(jsonSchema.parse(nestedObj)).toEqual(nestedObj);
    });

    it("should validate complex nested structures", () => {
      const complex = {
        users: [
          {
            id: "1",
            name: "John",
            preferences: {
              theme: "dark",
              notifications: true,
            },
          },
          {
            id: "2",
            name: "Jane",
            preferences: {
              theme: "light",
              notifications: false,
            },
          },
        ],
        metadata: {
          total: 2,
          lastUpdated: "2023-01-01",
        },
      };
      expect(jsonSchema.parse(complex)).toEqual(complex);
    });

    it("should reject invalid values", () => {
      expect(() => jsonSchema.parse(undefined)).toThrow();
      expect(() => jsonSchema.parse(Symbol("test"))).toThrow();
      expect(() => jsonSchema.parse(() => {})).toThrow();
    });

    it("should reject objects with non-string keys", () => {
      const objWithNumberKey = { 42: "value" };
      // The current jsonSchema implementation uses z.record(z.string(), jsonSchema) which only accepts string keys
      // But JavaScript converts numeric keys to strings, so this actually works
      // Let's test with a Symbol key instead, which should fail
      const objWithSymbolKey = { [Symbol("test")]: "value" };
      expect(() => jsonSchema.parse(objWithSymbolKey)).toThrow();
    });
  });

  describe("JsonSchema Type", () => {
    it("should correctly type JSON schema values", () => {
      const validJson: JsonSchema = {
        string: "value",
        number: 42,
        boolean: true,
        nullValue: null,
        array: ["string", 42],
        nested: {
          value: "nested",
          array: [true, false],
        },
      };

      expect(validJson.string).toBe("value");
      expect(validJson.number).toBe(42);
      expect(validJson.boolean).toBe(true);
      expect(validJson.nullValue).toBe(null);
      expect(Array.isArray(validJson.array)).toBe(true);
      expect(typeof validJson.nested).toBe("object");
    });
  });
});
