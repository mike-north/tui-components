import { describe, it, expect, beforeAll } from "vitest";
import { createGauge, type GaugeInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("GaugeComponent", () => {
  let gauge: ReturnType<typeof createGauge>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    gauge = createGauge();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(gauge.metadata.name).toBe("gauge");
    });

    it("should have examples", () => {
      expect(gauge.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(gauge.metadata.supportedModes).toContain("ansi");
      expect(gauge.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - simple gauge without zones", () => {
    it("should render 0% gauge", () => {
      const input: GaugeInput = {
        value: 0,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("░");
      expect(result.output).toContain("0");
      expect(result.output).not.toContain("█");
    });

    it("should render 50% gauge", () => {
      const input: GaugeInput = {
        value: 50,
        min: 0,
        max: 100,
        width: 20,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("█");
      expect(result.output).toContain("░");
      expect(result.output).toContain("50");
    });

    it("should render 100% gauge", () => {
      const input: GaugeInput = {
        value: 100,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("100");
      expect(result.output).not.toContain("░");
    });
  });

  describe("render - multi-zone gauge", () => {
    it("should render gauge with 3 zones", () => {
      const input: GaugeInput = {
        value: 75,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("75");
      expect(result.lineCount).toBe(1);
    });

    it("should render value in success zone", () => {
      const input: GaugeInput = {
        value: 15,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("15");
    });

    it("should render value in warning zone", () => {
      const input: GaugeInput = {
        value: 50,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("50");
    });

    it("should render value in error zone", () => {
      const input: GaugeInput = {
        value: 90,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("90");
    });
  });

  describe("render - value at zone boundaries", () => {
    it("should handle value exactly at first zone boundary", () => {
      const input: GaugeInput = {
        value: 30,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("30");
    });

    it("should handle value exactly at second zone boundary", () => {
      const input: GaugeInput = {
        value: 70,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("70");
    });
  });

  describe("render - value at min/max", () => {
    it("should clamp value below min", () => {
      const input: GaugeInput = {
        value: -10,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      // Should display 0 (clamped)
      expect(result.output).toContain("0");
      expect(result.output).not.toContain("-10");
    });

    it("should clamp value above max", () => {
      const input: GaugeInput = {
        value: 150,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      // Should display 100 (clamped)
      expect(result.output).toContain("100");
      expect(result.output).not.toContain("150");
    });
  });

  describe("render - custom min/max range", () => {
    it("should handle non-zero min", () => {
      const input: GaugeInput = {
        value: 75,
        min: 50,
        max: 100,
        width: 10,
      };

      const result = gauge.render(input, defaultContext);

      // 75 is 50% of the way from 50 to 100
      expect(result.output).toContain("75");
    });

    it("should handle negative range", () => {
      const input: GaugeInput = {
        value: 0,
        min: -50,
        max: 50,
        width: 10,
      };

      const result = gauge.render(input, defaultContext);

      // 0 is 50% of the way from -50 to 50
      expect(result.output).toContain("0");
    });

    it("should handle small range", () => {
      const input: GaugeInput = {
        value: 5,
        min: 0,
        max: 10,
        width: 10,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("5");
    });
  });

  describe("render - all styles", () => {
    it("should render bar style", () => {
      const input: GaugeInput = {
        value: 50,
        style: "bar",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("█");
      expect(result.output).toContain("░");
    });

    it("should render segments style", () => {
      const input: GaugeInput = {
        value: 50,
        style: "segments",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("▰");
      expect(result.output).toContain("▱");
    });

    it("should render blocks style", () => {
      const input: GaugeInput = {
        value: 50,
        style: "blocks",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("■");
      expect(result.output).toContain("□");
    });
  });

  describe("render - labels and values", () => {
    it("should display label before gauge", () => {
      const input: GaugeInput = {
        value: 50,
        label: "CPU:",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("CPU:");
      // Label should come before the bar
      const labelIndex = result.output.indexOf("CPU:");
      const barIndex = result.output.indexOf("█");
      expect(labelIndex).toBeLessThan(barIndex);
    });

    it("should display unit with value", () => {
      const input: GaugeInput = {
        value: 85,
        unit: "%",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("85%");
    });

    it("should display temperature unit", () => {
      const input: GaugeInput = {
        value: 65,
        unit: "°C",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("65°C");
    });

    it("should hide value when showValue is false", () => {
      const input: GaugeInput = {
        value: 50,
        showValue: false,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).not.toContain("50");
    });
  });

  describe("render - out-of-range values", () => {
    it("should clamp value below min", () => {
      const input: GaugeInput = {
        value: -20,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      // Should not contain negative value
      expect(result.output).toContain("0");
      expect(result.output).not.toContain("-20");
    });

    it("should clamp value above max", () => {
      const input: GaugeInput = {
        value: 200,
        min: 0,
        max: 100,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("100");
      expect(result.output).not.toContain("200");
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode without ANSI codes", () => {
      const input: GaugeInput = {
        value: 50,
        label: "Progress:",
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should contain anchor character
      expect(result.output).toContain("│");
      expect(result.output).toContain("Progress:");
      expect(result.output).toContain("50");
    });

    it("should render zones in markdown with inline code for emphasis", () => {
      const input: GaugeInput = {
        value: 80,
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should have backticks for emphasized zones
      expect(result.output).toContain("`");
    });

    // Regression tests for double-backtick consolidation issue
    // When adjacent zones both need emphasis (warning + error), they should be
    // consolidated into a single backtick-wrapped segment to avoid `zone1``zone2`
    // which renders incorrectly in markdown (creates a visible gap).

    it("should consolidate adjacent emphasized zones into single backtick segment", () => {
      const input: GaugeInput = {
        value: 85,
        width: 20,
        label: "CPU:",
        zones: [
          { threshold: 30, color: "success" },
          { threshold: 70, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should NOT contain double backticks (adjacent inline code spans)
      expect(result.output).not.toContain("``");
    });

    it("should not have double backticks when value spans warning and error zones", () => {
      const input: GaugeInput = {
        value: 90,
        width: 10,
        zones: [
          { threshold: 50, color: "warning" },
          { threshold: 100, color: "error" },
        ],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should NOT contain double backticks
      expect(result.output).not.toContain("``");
    });

    it("should have exactly one backtick pair for fully emphasized gauge", () => {
      const input: GaugeInput = {
        value: 100,
        width: 10,
        showValue: false,
        zones: [{ threshold: 100, color: "error" }],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Count backticks - should be exactly 2 (one pair)
      const backtickCount = (result.output.match(/`/g) || []).length;
      expect(backtickCount).toBe(2);
    });

    it("should keep separate backtick pairs for non-adjacent emphasized zones", () => {
      // This tests a theoretical case where emphasized zones are separated
      // by a non-emphasized zone (success). In practice with our zone model,
      // this is unlikely, but the logic should handle it.
      const input: GaugeInput = {
        value: 50,
        width: 20,
        showValue: false,
        zones: [
          { threshold: 30, color: "warning" }, // First 30% - emphasized
          { threshold: 70, color: "success" }, // 30-70% - not emphasized
          { threshold: 100, color: "error" }, // 70-100% - emphasized (but empty since value=50)
        ],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should still not have double backticks
      expect(result.output).not.toContain("``");
    });

    it("should handle single warning zone without double backticks", () => {
      const input: GaugeInput = {
        value: 100,
        width: 10,
        showValue: false,
        zones: [{ threshold: 100, color: "warning" }],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = gauge.render(input, markdownContext);

      // Should have exactly one pair of backticks
      const backtickCount = (result.output.match(/`/g) || []).length;
      expect(backtickCount).toBe(2);
      expect(result.output).not.toContain("``");
    });
  });

  describe("schema validation", () => {
    it("should validate correct input", () => {
      const input = {
        value: 50,
      };

      expect(() => gauge.schema.parse(input)).not.toThrow();
    });

    it("should apply defaults", () => {
      const input = {
        value: 50,
      };

      const parsed = gauge.schema.parse(input);

      expect(parsed.min).toBe(0);
      expect(parsed.max).toBe(100);
      expect(parsed.width).toBe(20);
      expect(parsed.style).toBe("bar");
      expect(parsed.showValue).toBe(true);
      expect(parsed.unit).toBe("");
    });

    it("should reject invalid style", () => {
      const input = {
        value: 50,
        style: "invalid",
      };

      expect(() => gauge.schema.parse(input)).toThrow();
    });

    it("should reject invalid zone color", () => {
      const input = {
        value: 50,
        zones: [{ threshold: 100, color: "invalid" }],
      };

      expect(() => gauge.schema.parse(input)).toThrow();
    });

    it("should accept zones without color", () => {
      const input = {
        value: 50,
        zones: [{ threshold: 50 }, { threshold: 100 }],
      };

      expect(() => gauge.schema.parse(input)).not.toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = gauge.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("actualWidth", () => {
    it("should provide correct actualWidth", () => {
      const input: GaugeInput = {
        value: 50,
        width: 20,
        label: "Test",
      };

      const result = gauge.render(input, defaultContext);

      expect(result.actualWidth).toBeGreaterThan(0);
    });
  });

  describe("render - all examples", () => {
    it("should render all examples without errors", () => {
      for (const example of gauge.metadata.examples) {
        expect(() => {
          gauge.render(example.input, defaultContext);
        }).not.toThrow();
      }
    });
  });

  describe("edge cases", () => {
    it("should handle min equal to max", () => {
      const input: GaugeInput = {
        value: 50,
        min: 50,
        max: 50,
      };

      // Should not throw, though behavior is undefined
      expect(() => gauge.render(input, defaultContext)).not.toThrow();
    });

    it("should handle very narrow width", () => {
      const input: GaugeInput = {
        value: 50,
        width: 2,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.lineCount).toBe(1);
    });

    it("should handle decimal values", () => {
      const input: GaugeInput = {
        value: 33.33,
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("33.33");
    });

    it("should handle zones with no color", () => {
      const input: GaugeInput = {
        value: 50,
        zones: [{ threshold: 50 }, { threshold: 100 }],
      };

      const result = gauge.render(input, defaultContext);

      expect(result.output).toContain("50");
    });
  });
});
