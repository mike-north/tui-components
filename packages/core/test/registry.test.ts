import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { ComponentRegistry, BaseTuiComponent } from "../src/index.js";
import type {
  ComponentMetadata,
  RenderContext,
  RenderResult,
} from "../src/index.js";

const testSchema = z.string();

// Test component implementation
class TestComponent extends BaseTuiComponent<string, z.ZodString> {
  readonly metadata: ComponentMetadata<string> = {
    name: "test",
    description: "A test component",
    version: "1.0.0",
    examples: [{ name: "basic", input: "hello" }],
  };

  readonly schema = z.string();

  render(input: string, _context: RenderContext): RenderResult {
    return {
      output: input,
      actualWidth: input.length,
      lineCount: 1,
    };
  }
}

describe("ComponentRegistry", () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  it("should register a component via factory function", () => {
    const component = registry.register(() => new TestComponent());
    expect(component.metadata.name).toBe("test");
    expect(registry.has("test")).toBe(true);
  });

  it("should get a registered component by name", () => {
    registry.register(() => new TestComponent());
    const component = registry.get("test");
    expect(component).toBeDefined();
    expect(component?.metadata.name).toBe("test");
  });

  it("should return undefined for unregistered component", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("should list all registered components", () => {
    registry.register(() => new TestComponent());
    const list = registry.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({
      name: "test",
      description: "A test component",
      version: "1.0.0",
    });
  });

  it("should throw when registering duplicate component names", () => {
    registry.register(() => new TestComponent());
    expect(() => registry.register(() => new TestComponent())).toThrow(
      'Component "test" is already registered'
    );
  });

  it("should clear all components", () => {
    registry.register(() => new TestComponent());
    expect(registry.has("test")).toBe(true);
    registry.clear();
    expect(registry.has("test")).toBe(false);
  });

  it("should return component names", () => {
    registry.register(() => new TestComponent());
    expect(registry.names()).toEqual(["test"]);
  });
});

describe("BaseTuiComponent", () => {
  it("should generate JSON schema from Zod schema", () => {
    const component = new TestComponent();
    const jsonSchema = component.getJsonSchema() as Record<string, unknown>;
    // zod-to-json-schema generates a schema with definitions and a $ref
    expect(jsonSchema).toHaveProperty("$ref");
    expect(jsonSchema).toHaveProperty("definitions");
    const definitions = jsonSchema["definitions"] as Record<string, unknown>;
    expect(definitions).toHaveProperty("test");
    const testDef = definitions["test"] as Record<string, unknown>;
    expect(testDef).toHaveProperty("type", "string");
  });
});
