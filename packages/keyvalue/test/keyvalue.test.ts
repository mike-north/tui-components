import { describe, it, expect, beforeAll } from "vitest";
import { createKeyValue, type KeyValueInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("KeyValueComponent", () => {
  let kv: ReturnType<typeof createKeyValue>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    kv = createKeyValue();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(kv.metadata.name).toBe("keyvalue");
    });

    it("should have examples", () => {
      expect(kv.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("render", () => {
    it("should render simple key-value pairs", () => {
      const input: KeyValueInput = {
        pairs: [
          { key: "Name", value: "John" },
          { key: "Age", value: 30 },
        ],
      };

      const result = kv.render(input, defaultContext);

      // Keys are aligned, so "Age" is padded to match "Name" length
      expect(result.output).toContain("Name:");
      expect(result.output).toContain("John");
      expect(result.output).toContain("Age");
      expect(result.output).toContain(":");
      expect(result.output).toContain("30");
      expect(result.lineCount).toBe(2);
    });

    it("should align keys by default", () => {
      const input: KeyValueInput = {
        pairs: [
          { key: "Short", value: "value1" },
          { key: "Much longer key", value: "value2" },
        ],
      };

      const result = kv.render(input, defaultContext);
      const lines = result.output.split("\n");

      // The colon should be at the same position for both lines
      const colonPos1 = lines[0]?.indexOf(":") ?? -1;
      const colonPos2 = lines[1]?.indexOf(":") ?? -1;
      expect(colonPos1).toBe(colonPos2);
    });

    it("should not align keys when alignKeys is false", () => {
      const input: KeyValueInput = {
        pairs: [
          { key: "Short", value: "value1" },
          { key: "Much longer key", value: "value2" },
        ],
        alignKeys: false,
      };

      const result = kv.render(input, defaultContext);
      const lines = result.output.split("\n");

      // The colons should be at different positions
      const colonPos1 = lines[0]?.indexOf(":") ?? -1;
      const colonPos2 = lines[1]?.indexOf(":") ?? -1;
      expect(colonPos1).not.toBe(colonPos2);
    });

    it("should use equals separator", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "HOST", value: "localhost" }],
        separator: "equals",
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toContain("HOST=");
      expect(result.output).toContain("localhost");
    });

    it("should use arrow separator", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "Input", value: "data.json" }],
        separator: "arrow",
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toContain("Input→");
      expect(result.output).toContain("data.json");
    });

    it("should use dots separator", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "Version", value: "1.0.0" }],
        separator: "dots",
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toContain("Version...");
      expect(result.output).toContain("1.0.0");
    });

    it("should use no separator when set to none", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "Label", value: "Value" }],
        separator: "none",
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).not.toContain(":");
      expect(result.output).not.toContain("=");
      expect(result.output).toContain("Label");
      expect(result.output).toContain("Value");
    });

    it("should handle boolean values", () => {
      const input: KeyValueInput = {
        pairs: [
          { key: "Enabled", value: true },
          { key: "Debug", value: false },
        ],
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toContain("true");
      expect(result.output).toContain("false");
    });

    it("should handle numeric values", () => {
      const input: KeyValueInput = {
        pairs: [
          { key: "Count", value: 42 },
          { key: "Price", value: 19.99 },
        ],
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toContain("42");
      expect(result.output).toContain("19.99");
    });

    it("should respect minKeyWidth", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "A", value: "value" }],
        minKeyWidth: 10,
      };

      const result = kv.render(input, defaultContext);

      // Key "A" should be padded to at least 10 characters before the colon
      expect(result.output).toMatch(/A\s+:/);
    });

    it("should handle custom gap", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "Key", value: "Value" }],
        gap: 3,
      };

      const result = kv.render(input, defaultContext);

      // There should be 3 spaces between colon and value
      expect(result.output).toContain(":   Value");
    });

    it("should handle empty pairs array", () => {
      const input: KeyValueInput = {
        pairs: [],
      };

      const result = kv.render(input, defaultContext);

      expect(result.output).toBe("");
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "test", value: "value" }],
      };

      expect(() => kv.schema.parse(input)).not.toThrow();
    });

    it("should apply default values", () => {
      const input: KeyValueInput = {
        pairs: [{ key: "test", value: "value" }],
      };

      const parsed = kv.schema.parse(input);

      expect(parsed.separator).toBe("colon");
      expect(parsed.alignKeys).toBe(true);
      expect(parsed.gap).toBe(1);
    });

    it("should reject invalid separator", () => {
      const input = {
        pairs: [{ key: "test", value: "value" }],
        separator: "invalid",
      };

      expect(() => kv.schema.parse(input)).toThrow();
    });

    it("should reject missing pairs", () => {
      const input = {};

      expect(() => kv.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = kv.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });
});
