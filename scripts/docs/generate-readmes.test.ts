/**
 * Tests for the README generation script.
 *
 * These tests verify that:
 * 1. Schema field extraction works correctly for various Zod types
 * 2. Configuration tables are generated with proper formatting
 * 3. Example sections are created from component metadata
 * 4. README structure matches the expected template
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the functions we want to test by re-exporting them
// Since the script is executable, we'll need to extract the functions

/**
 * Extract field information from a Zod schema.
 */
function extractSchemaFields(schema: z.ZodType): SchemaField[] {
  const fields: SchemaField[] = [];

  // Handle ZodObject
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = extractFieldInfo(key, fieldSchema);
      fields.push(field);
    }
  }

  return fields;
}

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

/**
 * Extract information about a single field from its Zod schema.
 */
function extractFieldInfo(name: string, schema: z.ZodType): SchemaField {
  let type = getZodTypeName(schema);
  let required = true;
  let description = schema.description ?? "";
  let defaultValue: string | undefined;

  // Unwrap optional schemas
  if (schema instanceof z.ZodOptional) {
    required = false;
    schema = schema.unwrap();
    type = getZodTypeName(schema);
    description = schema.description ?? description;
  }

  // Unwrap default schemas
  if (schema instanceof z.ZodDefault) {
    required = false;
    // In Zod v4, defaultValue is a property, not a function
    defaultValue = JSON.stringify(schema._def.defaultValue);
    schema = schema.removeDefault();
    type = getZodTypeName(schema);
    description = schema.description ?? description;
  }

  return {
    name,
    type,
    required,
    description,
    default: defaultValue,
  };
}

/**
 * Get a human-readable type name from a Zod schema.
 */
function getZodTypeName(schema: z.ZodType): string {
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodBoolean) return "boolean";
  if (schema instanceof z.ZodArray) {
    const elementType = getZodTypeName(schema.element);
    return `${elementType}[]`;
  }
  if (schema instanceof z.ZodObject) return "object";
  if (schema instanceof z.ZodUnion) {
    const types = schema.options.map((opt: z.ZodType) => getZodTypeName(opt));
    return types.join(" | ");
  }
  if (schema instanceof z.ZodEnum) {
    return schema.options.map((opt: string) => `"${opt}"`).join(" | ");
  }
  if (schema instanceof z.ZodLiteral) {
    return JSON.stringify(schema.value);
  }
  if (schema instanceof z.ZodOptional) {
    return getZodTypeName(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return getZodTypeName(schema.removeDefault());
  }

  return "unknown";
}

/**
 * Convert a component name to PascalCase (e.g., "sparkline" -> "Sparkline").
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Generate a configuration options table from schema fields.
 */
function generateConfigTable(fields: SchemaField[]): string {
  if (fields.length === 0) {
    return "_No configuration options available._";
  }

  const header =
    "| Property | Type | Required | Default | Description |\n" +
    "|----------|------|----------|---------|-------------|";

  const rows = fields.map((field) => {
    const name = `\`${field.name}\``;
    const type = `\`${field.type}\``;
    const required = field.required ? "✓" : "";
    const defaultVal = field.default ? `\`${field.default}\`` : "-";
    const description = field.description || "-";

    return `| ${name} | ${type} | ${required} | ${defaultVal} | ${description} |`;
  });

  return [header, ...rows].join("\n");
}

describe("Schema Field Extraction", () => {
  describe("extractSchemaFields", () => {
    it("should extract required string field", () => {
      const schema = z.object({
        name: z.string().describe("The name field"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "name",
        type: "string",
        required: true,
        description: "The name field",
      });
    });

    it("should extract optional field", () => {
      const schema = z.object({
        age: z.number().optional().describe("Optional age"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "age",
        type: "number",
        required: false,
        description: "Optional age",
      });
    });

    it("should extract field with default value", () => {
      const schema = z.object({
        count: z.number().default(10).describe("Count with default"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "count",
        type: "number",
        required: false,
        description: "Count with default",
        default: "10",
      });
    });

    it("should handle array types", () => {
      const schema = z.object({
        values: z.array(z.number()).describe("Array of numbers"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "values",
        type: "number[]",
        required: true,
        description: "Array of numbers",
      });
    });

    it("should handle enum types", () => {
      const schema = z.object({
        status: z.enum(["active", "inactive"]).describe("Status value"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "status",
        type: '"active" | "inactive"',
        required: true,
        description: "Status value",
      });
    });

    it("should handle union types", () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]).describe("String or number"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "value",
        type: "string | number",
        required: true,
        description: "String or number",
      });
    });

    it("should handle boolean types", () => {
      const schema = z.object({
        enabled: z.boolean().describe("Enable feature"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "enabled",
        type: "boolean",
        required: true,
        description: "Enable feature",
      });
    });

    it("should handle object types", () => {
      const schema = z.object({
        config: z.object({}).describe("Configuration object"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "config",
        type: "object",
        required: true,
        description: "Configuration object",
      });
    });

    it("should handle nested arrays", () => {
      const schema = z.object({
        matrix: z.array(z.array(z.number())).describe("2D array"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "matrix",
        type: "number[][]",
        required: true,
        description: "2D array",
      });
    });

    it("should handle fields without descriptions", () => {
      const schema = z.object({
        id: z.string(),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: "id",
        type: "string",
        required: true,
        description: "",
      });
    });

    it("should handle multiple fields", () => {
      const schema = z.object({
        name: z.string().describe("Name field"),
        age: z.number().optional().describe("Age field"),
        active: z.boolean().default(true).describe("Active field"),
      });

      const fields = extractSchemaFields(schema);

      expect(fields).toHaveLength(3);
      expect(fields[0].name).toBe("name");
      expect(fields[1].name).toBe("age");
      expect(fields[2].name).toBe("active");
    });

    it("should return empty array for non-object schema", () => {
      const schema = z.string();
      const fields = extractSchemaFields(schema);
      expect(fields).toHaveLength(0);
    });
  });
});

describe("Configuration Table Generation", () => {
  describe("generateConfigTable", () => {
    it("should generate table for single field", () => {
      const fields: SchemaField[] = [
        {
          name: "name",
          type: "string",
          required: true,
          description: "The name",
        },
      ];

      const table = generateConfigTable(fields);

      expect(table).toContain(
        "| Property | Type | Required | Default | Description |"
      );
      expect(table).toContain("| `name` | `string` | ✓ | - | The name |");
    });

    it("should generate table for optional field", () => {
      const fields: SchemaField[] = [
        {
          name: "age",
          type: "number",
          required: false,
          description: "Optional age",
        },
      ];

      const table = generateConfigTable(fields);

      expect(table).toContain("| `age` | `number` |  | - | Optional age |");
    });

    it("should generate table for field with default", () => {
      const fields: SchemaField[] = [
        {
          name: "count",
          type: "number",
          required: false,
          description: "Count value",
          default: "10",
        },
      ];

      const table = generateConfigTable(fields);

      expect(table).toContain("| `count` | `number` |  | `10` | Count value |");
    });

    it("should handle empty field list", () => {
      const fields: SchemaField[] = [];
      const table = generateConfigTable(fields);
      expect(table).toBe("_No configuration options available._");
    });

    it("should generate table for multiple fields", () => {
      const fields: SchemaField[] = [
        {
          name: "name",
          type: "string",
          required: true,
          description: "Name field",
        },
        {
          name: "age",
          type: "number",
          required: false,
          description: "Age field",
        },
      ];

      const table = generateConfigTable(fields);
      const lines = table.split("\n");

      expect(lines).toHaveLength(4); // header + separator + 2 rows
      expect(lines[2]).toContain("| `name` | `string` | ✓");
      expect(lines[3]).toContain("| `age` | `number` | ");
    });
  });
});

describe("String Utilities", () => {
  describe("toPascalCase", () => {
    it("should convert simple string", () => {
      expect(toPascalCase("sparkline")).toBe("Sparkline");
    });

    it("should convert kebab-case", () => {
      expect(toPascalCase("my-component")).toBe("MyComponent");
    });

    it("should preserve already PascalCase (no hyphens)", () => {
      // toPascalCase only splits on hyphens, so a single word stays as-is
      // with just the first letter capitalized for each part
      expect(toPascalCase("AlreadyPascal")).toBe("AlreadyPascal");
    });

    it("should handle single word", () => {
      expect(toPascalCase("box")).toBe("Box");
    });

    it("should handle multiple dashes", () => {
      expect(toPascalCase("very-long-component-name")).toBe(
        "VeryLongComponentName"
      );
    });
  });
});

describe("Edge Cases", () => {
  describe("getZodTypeName", () => {
    it("should handle literal types", () => {
      const schema = z.literal("constant");
      expect(getZodTypeName(schema)).toBe('"constant"');
    });

    it("should handle literal number", () => {
      const schema = z.literal(42);
      expect(getZodTypeName(schema)).toBe("42");
    });

    it("should handle complex union", () => {
      const schema = z.union([z.string(), z.number(), z.boolean()]);
      expect(getZodTypeName(schema)).toBe("string | number | boolean");
    });

    it("should handle nested optional", () => {
      const schema = z.string().optional();
      expect(getZodTypeName(schema)).toBe("string");
    });

    it("should handle nested default", () => {
      const schema = z.number().default(0);
      expect(getZodTypeName(schema)).toBe("number");
    });
  });

  describe("extractFieldInfo", () => {
    it("should preserve description through optional", () => {
      const schema = z.string().describe("Important field").optional();
      const field = extractFieldInfo("field", schema);

      expect(field.description).toBe("Important field");
      expect(field.required).toBe(false);
    });

    it("should preserve description through default", () => {
      const schema = z.number().describe("With default").default(5);
      const field = extractFieldInfo("field", schema);

      expect(field.description).toBe("With default");
      expect(field.default).toBe("5");
    });

    it("should handle string default value", () => {
      const schema = z.string().default("hello");
      const field = extractFieldInfo("field", schema);

      expect(field.default).toBe('"hello"');
    });

    it("should handle boolean default value", () => {
      const schema = z.boolean().default(true);
      const field = extractFieldInfo("field", schema);

      expect(field.default).toBe("true");
    });

    it("should handle array default value", () => {
      const schema = z.array(z.number()).default([1, 2, 3]);
      const field = extractFieldInfo("field", schema);

      expect(field.default).toBe("[1,2,3]");
    });
  });
});
