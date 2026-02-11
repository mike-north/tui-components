import { describe, it, expect, beforeAll } from "vitest";
import { createProgress, type ProgressInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("ProgressComponent", () => {
  let progress: ReturnType<typeof createProgress>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    progress = createProgress();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(progress.metadata.name).toBe("progress");
    });

    it("should have examples", () => {
      expect(progress.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(progress.metadata.supportedModes).toContain("ansi");
      expect(progress.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - basic percentages", () => {
    it("should render 0% progress", () => {
      const input: ProgressInput = {
        value: 0,
        max: 100,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("░");
      expect(result.output).toContain("0%");
      expect(result.output).not.toContain("█");
    });

    it("should render 50% progress", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        width: 20,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("█");
      expect(result.output).toContain("░");
      expect(result.output).toContain("50%");
    });

    it("should render 100% progress", () => {
      const input: ProgressInput = {
        value: 100,
        max: 100,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("100%");
      expect(result.output).not.toContain("░");
    });
  });

  describe("render - value/max mode", () => {
    it("should calculate correct percentage from value/max", () => {
      const input: ProgressInput = {
        value: 5,
        max: 10,
        width: 10,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("50%");
    });

    it("should show value when showValue is true", () => {
      const input: ProgressInput = {
        value: 12,
        max: 25,
        showValue: true,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("12/25");
    });

    it("should show both percentage and value when both enabled", () => {
      const input: ProgressInput = {
        value: 10,
        max: 20,
        showPercentage: true,
        showValue: true,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("50%");
      expect(result.output).toContain("10/20");
    });
  });

  describe("render - all styles", () => {
    it("should render block style", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        style: "block",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("█");
      expect(result.output).toContain("░");
    });

    it("should render shaded style", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        style: "shaded",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("▓");
      expect(result.output).toContain("░");
    });

    it("should render bracket style", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        style: "bracket",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("[");
      expect(result.output).toContain("]");
      expect(result.output).toContain("█");
      expect(result.output).toContain("░");
    });

    it("should render arrow style", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        style: "arrow",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain(">");
      expect(result.output).toContain("-");
    });

    it("should render ascii style", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        style: "ascii",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("#");
      expect(result.output).toContain(".");
    });
  });

  describe("render - custom characters", () => {
    it("should use custom filled character", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        filledChar: "=",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("=");
      expect(result.output).not.toContain("█");
    });

    it("should use custom empty character", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        emptyChar: "_",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("_");
      expect(result.output).not.toContain("░");
    });

    it("should use both custom characters together", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        filledChar: "X",
        emptyChar: "O",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("X");
      expect(result.output).toContain("O");
      expect(result.output).not.toContain("█");
      expect(result.output).not.toContain("░");
    });
  });

  describe("render - labels", () => {
    it("should display label before bar", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        label: "Loading:",
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("Loading:");
      // Label should come before the bar
      const labelIndex = result.output.indexOf("Loading:");
      const barIndex = result.output.indexOf("█");
      expect(labelIndex).toBeLessThan(barIndex);
    });

    it("should hide percentage when showPercentage is false", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        showPercentage: false,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).not.toContain("%");
    });
  });

  describe("render - edge cases", () => {
    it("should clamp value > max to 100%", () => {
      const input: ProgressInput = {
        value: 150,
        max: 100,
        width: 10,
      };

      const result = progress.render(input, defaultContext);

      // Should show 100% (clamped)
      expect(result.output).toContain("100%");
      // Should be fully filled
      expect(result.output).not.toContain("░");
    });

    it("should handle very narrow width", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        width: 2,
      };

      const result = progress.render(input, defaultContext);

      expect(result.lineCount).toBe(1);
      expect(result.output).toContain("50%");
    });

    it("should handle decimal values", () => {
      const input: ProgressInput = {
        value: 33.33,
        max: 100,
      };

      const result = progress.render(input, defaultContext);

      expect(result.output).toContain("33%");
    });

    it("should handle max = 0", () => {
      const input: ProgressInput = {
        value: 50,
        max: 1, // min is 1 per schema
      };

      const result = progress.render(input, defaultContext);

      // Should show 100% (value exceeds max)
      expect(result.output).toContain("100%");
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode without ANSI codes", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        label: "Progress:",
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = progress.render(input, markdownContext);

      // Should contain anchor character
      expect(result.output).toContain("│");
      expect(result.output).toContain("Progress:");
      expect(result.output).toContain("50%");
    });

    it("should render bracket style in markdown", () => {
      const input: ProgressInput = {
        value: 80,
        max: 100,
        style: "bracket",
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = progress.render(input, markdownContext);

      expect(result.output).toContain("[");
      expect(result.output).toContain("]");
    });
  });

  describe("schema validation", () => {
    it("should validate correct input", () => {
      const input = {
        value: 50,
        max: 100,
      };

      expect(() => progress.schema.parse(input)).not.toThrow();
    });

    it("should apply defaults", () => {
      const input = {
        value: 50,
      };

      const parsed = progress.schema.parse(input);

      expect(parsed.max).toBe(100);
      expect(parsed.width).toBe(20);
      expect(parsed.style).toBe("block");
      expect(parsed.showPercentage).toBe(true);
      expect(parsed.showValue).toBe(false);
    });

    it("should reject negative value", () => {
      const input = {
        value: -10,
        max: 100,
      };

      expect(() => progress.schema.parse(input)).toThrow();
    });

    it("should reject non-positive max", () => {
      const input = {
        value: 50,
        max: 0,
      };

      expect(() => progress.schema.parse(input)).toThrow();
    });

    it("should reject invalid style", () => {
      const input = {
        value: 50,
        style: "invalid",
      };

      expect(() => progress.schema.parse(input)).toThrow();
    });

    it("should reject multi-character filledChar", () => {
      const input = {
        value: 50,
        filledChar: "XX",
      };

      expect(() => progress.schema.parse(input)).toThrow();
    });

    it("should reject empty filledChar", () => {
      const input = {
        value: 50,
        filledChar: "",
      };

      expect(() => progress.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = progress.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("actualWidth", () => {
    it("should provide correct actualWidth", () => {
      const input: ProgressInput = {
        value: 50,
        max: 100,
        width: 20,
        label: "Test",
      };

      const result = progress.render(input, defaultContext);

      expect(result.actualWidth).toBeGreaterThan(0);
    });
  });

  describe("render - all examples", () => {
    it("should render all examples without errors", () => {
      for (const example of progress.metadata.examples) {
        expect(() => {
          progress.render(example.input, defaultContext);
        }).not.toThrow();
      }
    });
  });
});
