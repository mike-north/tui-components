import { describe, it, expect, beforeAll } from "vitest";
import { createCallout, type CalloutInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("CalloutComponent", () => {
  let callout: ReturnType<typeof createCallout>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    callout = createCallout();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(callout.metadata.name).toBe("callout");
    });

    it("should have examples", () => {
      expect(callout.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(callout.metadata.supportedModes).toContain("ansi");
      expect(callout.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - types", () => {
    it("should render tip callout", () => {
      const input: CalloutInput = {
        type: "tip",
        message: "A helpful tip",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("💡");
      expect(result.output).toContain("Tip");
      expect(result.output).toContain("A helpful tip");
    });

    it("should render note callout", () => {
      const input: CalloutInput = {
        type: "note",
        message: "An important note",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("📝");
      expect(result.output).toContain("Note");
    });

    it("should render info callout", () => {
      const input: CalloutInput = {
        type: "info",
        message: "Some information",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("ℹ️");
      expect(result.output).toContain("Info");
    });

    it("should render warning callout", () => {
      const input: CalloutInput = {
        type: "warning",
        message: "A warning message",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("⚠️");
      expect(result.output).toContain("Warning");
    });

    it("should render error callout", () => {
      const input: CalloutInput = {
        type: "error",
        message: "An error occurred",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("❌");
      expect(result.output).toContain("Error");
    });

    it("should render success callout", () => {
      const input: CalloutInput = {
        type: "success",
        message: "Operation successful",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("✅");
      expect(result.output).toContain("Success");
    });
  });

  describe("render - custom title and icon", () => {
    it("should use custom title", () => {
      const input: CalloutInput = {
        type: "info",
        title: "Custom Title",
        message: "Message content",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("Custom Title");
      expect(result.output).not.toContain("Info");
    });

    it("should use custom icon", () => {
      const input: CalloutInput = {
        type: "info",
        icon: "🚀",
        message: "Message content",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("🚀");
      expect(result.output).not.toContain("ℹ️");
    });

    it("should hide icon when set to empty string", () => {
      const input: CalloutInput = {
        type: "tip",
        icon: "",
        message: "Message without icon",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).not.toContain("💡");
      expect(result.output).toContain("Tip");
    });
  });

  describe("render - border styles", () => {
    it("should render with round border by default", () => {
      const input: CalloutInput = {
        message: "Test message",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("╭");
      expect(result.output).toContain("╰");
    });

    it("should render with single border", () => {
      const input: CalloutInput = {
        message: "Test message",
        borderStyle: "single",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("┌");
      expect(result.output).toContain("└");
    });

    it("should render with double border", () => {
      const input: CalloutInput = {
        message: "Test message",
        borderStyle: "double",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("╔");
      expect(result.output).toContain("╚");
    });

    it("should render with bold border", () => {
      const input: CalloutInput = {
        message: "Test message",
        borderStyle: "bold",
      };

      const result = callout.render(input, defaultContext);

      expect(result.output).toContain("┏");
      expect(result.output).toContain("┗");
    });
  });

  describe("render - text wrapping", () => {
    it("should wrap long messages", () => {
      const input: CalloutInput = {
        message:
          "This is a very long message that should be wrapped across multiple lines because it exceeds the callout width.",
        width: 50,
      };

      const result = callout.render(input, defaultContext);

      expect(result.lineCount).toBeGreaterThan(5);
    });

    it("should preserve short messages on single line", () => {
      const input: CalloutInput = {
        message: "Short",
        width: 50,
      };

      const result = callout.render(input, defaultContext);

      // Should have: top border, empty line, message line, empty line, bottom border = 5 lines
      expect(result.lineCount).toBe(5);
    });
  });

  describe("render - fixed width", () => {
    it("should respect fixed width", () => {
      const input: CalloutInput = {
        message: "Test message",
        width: 60,
      };

      const result = callout.render(input, defaultContext);

      expect(result.actualWidth).toBe(60);
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode with anchors", () => {
      const input: CalloutInput = {
        type: "info",
        message: "Test message",
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = callout.render(input, markdownContext);

      expect(result.output).toContain("│");
    });
  });

  describe("schema validation", () => {
    it("should validate correct input", () => {
      const input = {
        message: "Test",
      };

      expect(() => callout.schema.parse(input)).not.toThrow();
    });

    it("should apply default type", () => {
      const input = {
        message: "Test",
      };

      const parsed = callout.schema.parse(input);

      expect(parsed.type).toBe("info");
    });

    it("should apply default borderStyle", () => {
      const input = {
        message: "Test",
      };

      const parsed = callout.schema.parse(input);

      expect(parsed.borderStyle).toBe("round");
    });

    it("should reject invalid type", () => {
      const input = {
        type: "invalid",
        message: "Test",
      };

      expect(() => callout.schema.parse(input)).toThrow();
    });

    it("should reject invalid borderStyle", () => {
      const input = {
        message: "Test",
        borderStyle: "invalid",
      };

      expect(() => callout.schema.parse(input)).toThrow();
    });

    it("should reject missing message", () => {
      const input = {
        type: "info",
      };

      expect(() => callout.schema.parse(input)).toThrow();
    });

    it("should reject non-positive width", () => {
      const input = {
        message: "Test",
        width: 0,
      };

      expect(() => callout.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = callout.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("render - all examples", () => {
    it("should render all examples without errors", () => {
      for (const example of callout.metadata.examples) {
        expect(() => {
          callout.render(example.input, defaultContext);
        }).not.toThrow();
      }
    });
  });
});
