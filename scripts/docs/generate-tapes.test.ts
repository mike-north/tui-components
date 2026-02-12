/**
 * Tests for VHS tape generation script.
 */

import { describe, it, expect } from "vitest";
import { registry } from "@tuicomponents/core";

// Import all components to register them
import "@tuicomponents/box";
import "@tuicomponents/chart";
import "@tuicomponents/diff";
import "@tuicomponents/gauge";
import "@tuicomponents/graph";
import "@tuicomponents/keyvalue";
import "@tuicomponents/list";
import "@tuicomponents/progress";
import "@tuicomponents/sparkline";
import "@tuicomponents/table";
import "@tuicomponents/tree";

describe("Component Registry", () => {
  const VISUAL_COMPONENTS = [
    "sparkline",
    "table",
    "box",
    "list",
    "tree",
    "progress",
    "gauge",
    "diff",
    "keyvalue",
    "graph",
    "chart",
  ] as const;

  it("should have all visual components registered", () => {
    for (const componentName of VISUAL_COMPONENTS) {
      const component = registry.get(componentName);
      expect(component).toBeDefined();
    }
  });

  it("should have examples for all visual components", () => {
    for (const componentName of VISUAL_COMPONENTS) {
      const component = registry.get(componentName);
      expect(component?.metadata.examples).toBeDefined();
      expect(component?.metadata.examples.length).toBeGreaterThan(0);
    }
  });

  it("should have valid example data structure", () => {
    for (const componentName of VISUAL_COMPONENTS) {
      const component = registry.get(componentName);
      const examples = component?.metadata.examples ?? [];

      for (const example of examples) {
        // Each example should have a name
        expect(example.name).toBeDefined();
        expect(typeof example.name).toBe("string");
        expect(example.name.length).toBeGreaterThan(0);

        // Each example should have input
        expect(example.input).toBeDefined();

        // Description is optional but should be string if present
        if (example.description !== undefined) {
          expect(typeof example.description).toBe("string");
        }
      }
    }
  });
});

describe("JSON Escaping for Shell", () => {
  /**
   * Escape JSON for use in a shell command.
   * This is the same function used in the script.
   */
  function escapeJsonForShell(obj: unknown): string {
    const jsonStr = JSON.stringify(obj);
    return `'${jsonStr.replace(/'/g, "'\\''")}'`;
  }

  it("should escape simple JSON", () => {
    const input = { foo: "bar" };
    const escaped = escapeJsonForShell(input);
    expect(escaped).toBe(`'{"foo":"bar"}'`);
  });

  it("should escape JSON with single quotes", () => {
    const input = { message: "it's working" };
    const escaped = escapeJsonForShell(input);
    // Single quote should become '\''
    expect(escaped).toBe(`'{"message":"it'\\''s working"}'`);
  });

  it("should escape JSON with multiple single quotes", () => {
    const input = { path: "./foo's/bar's.ts" };
    const escaped = escapeJsonForShell(input);
    expect(escaped).toBe(`'{"path":"./foo'\\''s/bar'\\''s.ts"}'`);
  });

  it("should handle complex nested structures", () => {
    const input = {
      items: [
        { name: "item's name", value: 123 },
        { name: "another's", value: 456 },
      ],
    };
    const escaped = escapeJsonForShell(input);
    expect(escaped).toContain("'\\''");
    expect(escaped.startsWith("'")).toBe(true);
    expect(escaped.endsWith("'")).toBe(true);
  });

  it("should handle strings with no special characters", () => {
    const input = { simple: "no special chars" };
    const escaped = escapeJsonForShell(input);
    expect(escaped).toBe(`'{"simple":"no special chars"}'`);
  });
});

describe("Slugification", () => {
  /**
   * Create a slugified filename from an example name.
   * This is the same function used in the script.
   */
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  it("should convert spaces to hyphens", () => {
    expect(slugify("basic example")).toBe("basic-example");
  });

  it("should convert to lowercase", () => {
    expect(slugify("With Label")).toBe("with-label");
  });

  it("should remove special characters", () => {
    expect(slugify("foo/bar:baz")).toBe("foobarbaz");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });

  it("should handle mixed case and punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("should preserve hyphens", () => {
    expect(slugify("pre-existing-hyphens")).toBe("pre-existing-hyphens");
  });
});
