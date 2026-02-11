import { describe, it, expect } from "vitest";
import { computeLineLayout } from "../src/layout/line.js";
import { renderLineChartAnsi } from "../src/renderers/ansi.js";
import { renderLineChartMarkdown } from "../src/renderers/markdown.js";
import { BrailleCanvas } from "../src/core/chars.js";
import { chartInputSchema } from "../src/schema.js";

/**
 * Helper to create chart input with defaults applied.
 */
function createInput(overrides: Record<string, unknown> = {}) {
  return chartInputSchema.parse({
    type: "line",
    series: [
      {
        name: "Test",
        data: [
          { x: "A", y: 10 },
          { x: "B", y: 20 },
          { x: "C", y: 15 },
          { x: "D", y: 25 },
        ],
      },
    ],
    height: 8,
    width: 30,
    ...overrides,
  });
}

describe("Line Chart Layout", () => {
  describe("blocks mode (default)", () => {
    it("should compute layout with blocks style by default", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      expect(layout.type).toBe("line");
      expect(layout.lineStyle).toBe("blocks");
      expect(layout.categories).toEqual(["A", "B", "C", "D"]);
      expect(layout.seriesNames).toEqual(["Test"]);
    });

    it("should create point markers at data positions", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      // Check that rows contain point markers (●)
      const hasPointMarkers = layout.rows.some((row) =>
        row.chars.some((char) => char === "●")
      );
      expect(hasPointMarkers).toBe(true);
    });

    it("should create connecting lines between points", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      // Check for line-drawing characters (╱, ╲, ─)
      const allChars = layout.rows.flatMap((row) => row.chars);
      const hasRisingLine = allChars.includes("╱");
      const hasFallingLine = allChars.includes("╲");
      const hasHorizontalLine = allChars.includes("─");

      // At least one type of connecting line should exist
      expect(hasRisingLine || hasFallingLine || hasHorizontalLine).toBe(true);
    });

    it("should use 2 columns per category for blocks mode", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      // 4 categories * 2 - 1 = 7 columns (space for connecting lines)
      const expectedWidth = 4 * 2 - 1;
      expect(layout.rows[0]?.chars.length).toBe(expectedWidth);
    });

    it("should include Y-axis labels", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      const hasYLabels = layout.rows.some((row) => row.yLabel !== undefined);
      expect(hasYLabels).toBe(true);
    });

    it("should track series indices for coloring", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      // Check that series indices are tracked
      const hasSeriesIndices = layout.rows.some((row) =>
        row.seriesIndices.some((idx) => idx !== null)
      );
      expect(hasSeriesIndices).toBe(true);
    });
  });

  describe("braille mode", () => {
    it("should compute layout with braille style when specified", () => {
      const input = createInput({ lineStyle: "braille" });
      const layout = computeLineLayout(input);

      expect(layout.lineStyle).toBe("braille");
    });

    it("should use 3 columns per category for braille mode", () => {
      const input = createInput({ lineStyle: "braille" });
      const layout = computeLineLayout(input);

      // 4 categories * 3 = 12 columns
      const expectedWidth = 4 * 3;
      expect(layout.rows[0]?.chars.length).toBe(expectedWidth);
    });

    it("should produce braille characters", () => {
      const input = createInput({ lineStyle: "braille" });
      const layout = computeLineLayout(input);

      // Braille characters are in Unicode range U+2800-U+28FF
      const allChars = layout.rows.flatMap((row) => row.chars);
      const hasBraille = allChars.some((char) => {
        const code = char.charCodeAt(0);
        return code >= 0x2800 && code <= 0x28ff;
      });
      expect(hasBraille).toBe(true);
    });

    it("should draw connected lines in braille", () => {
      const input = createInput({ lineStyle: "braille" });
      const layout = computeLineLayout(input);

      // Should have non-space braille characters
      const allChars = layout.rows.flatMap((row) => row.chars);
      const nonSpaceCount = allChars.filter((c) => c !== " ").length;
      expect(nonSpaceCount).toBeGreaterThan(0);
    });
  });

  describe("dots mode", () => {
    it("should compute layout with dots style", () => {
      const input = createInput({ lineStyle: "dots" });
      const layout = computeLineLayout(input);

      expect(layout.lineStyle).toBe("dots");
    });

    it("should only show point markers without connecting lines", () => {
      const input = createInput({ lineStyle: "dots" });
      const layout = computeLineLayout(input);

      const allChars = layout.rows.flatMap((row) => row.chars);

      // Should have point markers
      const hasPoints = allChars.includes("●");
      expect(hasPoints).toBe(true);

      // Should NOT have line-drawing characters
      const hasRisingLine = allChars.includes("╱");
      const hasFallingLine = allChars.includes("╲");
      const hasHorizontalLine = allChars.includes("─");
      expect(hasRisingLine).toBe(false);
      expect(hasFallingLine).toBe(false);
      expect(hasHorizontalLine).toBe(false);
    });
  });

  describe("multi-series support", () => {
    it("should handle multiple series", () => {
      const input = createInput({
        series: [
          {
            name: "Series A",
            data: [
              { x: "A", y: 10 },
              { x: "B", y: 20 },
            ],
          },
          {
            name: "Series B",
            data: [
              { x: "A", y: 15 },
              { x: "B", y: 25 },
            ],
          },
        ],
      });
      const layout = computeLineLayout(input);

      expect(layout.seriesNames).toEqual(["Series A", "Series B"]);
      expect(layout.points.length).toBe(2);
    });

    it("should track different series indices for multi-series", () => {
      const input = createInput({
        series: [
          {
            name: "Series A",
            data: [
              { x: "A", y: 10 },
              { x: "B", y: 20 },
            ],
          },
          {
            name: "Series B",
            data: [
              { x: "A", y: 15 },
              { x: "B", y: 25 },
            ],
          },
        ],
      });
      const layout = computeLineLayout(input);

      // Check that we have both series index 0 and 1
      const allIndices = layout.rows.flatMap((row) =>
        row.seriesIndices.filter((idx) => idx !== null)
      );
      expect(allIndices).toContain(0);
      expect(allIndices).toContain(1);
    });

    it("should set useBackticks for alternating series", () => {
      const input = createInput({
        series: [
          {
            name: "Series A",
            data: [{ x: "A", y: 10 }],
          },
          {
            name: "Series B",
            data: [{ x: "A", y: 15 }],
          },
        ],
      });
      const layout = computeLineLayout(input);

      // Series B (index 1) should have useBackticks = true
      const hasBackticksUsage = layout.rows.some((row) =>
        row.useBackticks.some((ub) => ub === true)
      );
      expect(hasBackticksUsage).toBe(true);
    });
  });

  describe("Y-axis scaling", () => {
    it("should compute Y-scale from data", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      expect(layout.yScale.min).toBeLessThanOrEqual(10);
      expect(layout.yScale.max).toBeGreaterThanOrEqual(25);
    });

    it("should respect custom Y-axis min/max", () => {
      const input = createInput({
        yAxis: { min: 0, max: 100 },
      });
      const layout = computeLineLayout(input);

      expect(layout.yScale.min).toBe(0);
      expect(layout.yScale.max).toBe(100);
    });

    it("should generate nice tick values", () => {
      const input = createInput();
      const layout = computeLineLayout(input);

      expect(layout.yScale.ticks.length).toBeGreaterThan(0);
      // Ticks should be in ascending order
      for (let i = 1; i < layout.yScale.ticks.length; i++) {
        expect(layout.yScale.ticks[i]).toBeGreaterThan(
          layout.yScale.ticks[i - 1]!
        );
      }
    });
  });
});

describe("Line Chart ANSI Renderer", () => {
  it("should render blocks mode line chart", () => {
    const input = createInput();
    const layout = computeLineLayout(input);
    const output = renderLineChartAnsi(layout, { input });

    // Should contain axis characters
    expect(output).toContain("│");
    expect(output).toContain("─");
    expect(output).toContain("└");

    // Should contain point markers
    expect(output).toContain("●");
  });

  it("should render braille mode line chart", () => {
    const input = createInput({ lineStyle: "braille" });
    const layout = computeLineLayout(input);
    const output = renderLineChartAnsi(layout, { input });

    // Should contain axis characters
    expect(output).toContain("│");
    expect(output).toContain("─");
  });

  it("should render X-axis labels", () => {
    const input = createInput();
    const layout = computeLineLayout(input);
    const output = renderLineChartAnsi(layout, { input });

    // Should contain first characters of category labels
    expect(output).toContain("A");
    expect(output).toContain("B");
    expect(output).toContain("C");
    expect(output).toContain("D");
  });

  it("should render legend for multi-series", () => {
    const input = createInput({
      series: [
        {
          name: "Sales",
          data: [
            { x: "A", y: 10 },
            { x: "B", y: 20 },
          ],
        },
        {
          name: "Costs",
          data: [
            { x: "A", y: 15 },
            { x: "B", y: 25 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);
    const output = renderLineChartAnsi(layout, { input });

    expect(output).toContain("Sales");
    expect(output).toContain("Costs");
  });

  it("should not render legend for single series", () => {
    const input = createInput();
    const layout = computeLineLayout(input);
    const output = renderLineChartAnsi(layout, { input });

    // Single series named "Test" should not have legend
    const lines = output.split("\n");
    const legendLine = lines.find((line) => line.includes("Test"));
    // The legend would be a separate line not containing axis chars
    const nonAxisLines = lines.filter(
      (line) => !line.includes("│") && !line.includes("└")
    );
    const hasTestInLegend = nonAxisLines.some((line) => line.includes("Test"));
    expect(hasTestInLegend).toBe(false);
  });
});

describe("Line Chart Markdown Renderer", () => {
  it("should render blocks mode line chart", () => {
    const input = createInput();
    const layout = computeLineLayout(input);
    const output = renderLineChartMarkdown(layout, { input });

    // Should contain axis characters
    expect(output).toContain("│");
    expect(output).toContain("─");
    expect(output).toContain("└");
  });

  it("should use backticks for secondary series", () => {
    const input = createInput({
      series: [
        {
          name: "Series A",
          data: [
            { x: "A", y: 10 },
            { x: "B", y: 20 },
          ],
        },
        {
          name: "Series B",
          data: [
            { x: "A", y: 15 },
            { x: "B", y: 25 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);
    const output = renderLineChartMarkdown(layout, { input });

    // Should contain backticks for secondary series
    expect(output).toContain("`");
  });

  it("should render X-axis labels at correct positions for blocks mode", () => {
    const input = createInput();
    const layout = computeLineLayout(input);
    const output = renderLineChartMarkdown(layout, { input });
    const lines = output.split("\n");

    // Find the X-axis label line (last content line)
    const labelLine = lines[lines.length - 1];
    expect(labelLine).toBeDefined();

    // Should contain category initials
    expect(labelLine).toContain("A");
    expect(labelLine).toContain("B");
  });

  it("should render X-axis labels at correct positions for braille mode", () => {
    const input = createInput({ lineStyle: "braille" });
    const layout = computeLineLayout(input);
    const output = renderLineChartMarkdown(layout, { input });
    const lines = output.split("\n");

    // Find the X-axis label line
    const labelLine = lines[lines.length - 1];
    expect(labelLine).toBeDefined();

    // Should contain category initials with wider spacing
    expect(labelLine).toContain("A");
    expect(labelLine).toContain("B");
  });
});

describe("BrailleCanvas", () => {
  it("should create canvas with correct dimensions", () => {
    const canvas = new BrailleCanvas(10, 5);
    expect(canvas.width).toBe(10);
    expect(canvas.height).toBe(5);
  });

  it("should set individual dots", () => {
    const canvas = new BrailleCanvas(2, 2);
    canvas.setDot(0, 0, 0);

    const result = canvas.render();
    // Top-left dot of first character should be set
    expect(result.chars[0]![0]).not.toBe(" ");
  });

  it("should draw lines between points", () => {
    const canvas = new BrailleCanvas(5, 3);
    canvas.drawLine(0, 0, 8, 10, 0);

    const result = canvas.render();
    // Should have non-empty characters along the line
    const nonEmptyCount = result.chars
      .flat()
      .filter((c) => c !== " ").length;
    expect(nonEmptyCount).toBeGreaterThan(0);
  });

  it("should draw point markers as clusters", () => {
    const canvas = new BrailleCanvas(3, 3);
    canvas.drawPoint(2, 4, 0);

    const result = canvas.render();
    // Point should create a visible cluster
    const nonEmptyCount = result.chars
      .flat()
      .filter((c) => c !== " ").length;
    expect(nonEmptyCount).toBeGreaterThan(0);
  });

  it("should track series indices", () => {
    const canvas = new BrailleCanvas(3, 3);
    canvas.setDot(0, 0, 0);
    canvas.setDot(2, 4, 1);

    const result = canvas.render();
    // Should have different series indices
    const allIndices = result.seriesIndices
      .flat()
      .filter((idx) => idx !== null);
    expect(allIndices).toContain(0);
    expect(allIndices).toContain(1);
  });

  it("should render to correct braille characters", () => {
    const canvas = new BrailleCanvas(1, 1);
    // Set top-left dot (dot 1)
    canvas.setDot(0, 0, 0);

    const result = canvas.render();
    const char = result.chars[0]![0]!;
    // Braille character with dot 1 set should be U+2801
    expect(char.charCodeAt(0)).toBe(0x2801);
  });

  it("should combine multiple dots into single character", () => {
    const canvas = new BrailleCanvas(1, 1);
    // Set top-left and top-right dots (dots 1 and 4)
    canvas.setDot(0, 0, 0);
    canvas.setDot(1, 0, 0);

    const result = canvas.render();
    const char = result.chars[0]![0]!;
    // Braille character with dots 1 and 4 set should be U+2809
    expect(char.charCodeAt(0)).toBe(0x2809);
  });

  it("should handle out-of-bounds dots gracefully", () => {
    const canvas = new BrailleCanvas(2, 2);
    // These should not throw
    canvas.setDot(-1, 0, 0);
    canvas.setDot(100, 0, 0);
    canvas.setDot(0, -1, 0);
    canvas.setDot(0, 100, 0);

    const result = canvas.render();
    expect(result.chars.length).toBe(2);
  });
});

describe("Line Chart Edge Cases", () => {
  it("should handle single data point", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [{ x: "A", y: 10 }],
        },
      ],
    });
    const layout = computeLineLayout(input);

    expect(layout.categories).toEqual(["A"]);
    expect(layout.points[0]?.length).toBe(1);
  });

  it("should handle two data points", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 10 },
            { x: "B", y: 20 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);

    expect(layout.categories).toEqual(["A", "B"]);
    // Should have connecting line
    const allChars = layout.rows.flatMap((row) => row.chars);
    const hasLine =
      allChars.includes("╱") ||
      allChars.includes("╲") ||
      allChars.includes("─");
    expect(hasLine).toBe(true);
  });

  it("should handle flat line (all same values)", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 10 },
            { x: "B", y: 10 },
            { x: "C", y: 10 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);

    // Should render without errors
    expect(layout.rows.length).toBeGreaterThan(0);
  });

  it("should handle negative values", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: -10 },
            { x: "B", y: 20 },
            { x: "C", y: -5 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);

    expect(layout.yScale.min).toBeLessThan(0);
  });

  it("should handle large value ranges", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 1 },
            { x: "B", y: 1000000 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);

    // Should scale appropriately
    expect(layout.yScale.max).toBeGreaterThanOrEqual(1000000);
  });

  it("should handle numeric X values", () => {
    const input = createInput({
      series: [
        {
          name: "Test",
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
            { x: 3, y: 15 },
          ],
        },
      ],
    });
    const layout = computeLineLayout(input);

    expect(layout.categories).toEqual(["1", "2", "3"]);
  });
});

describe("Line Style Schema Validation", () => {
  it("should accept blocks style", () => {
    const result = chartInputSchema.safeParse({
      type: "line",
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      lineStyle: "blocks",
    });
    expect(result.success).toBe(true);
  });

  it("should accept braille style", () => {
    const result = chartInputSchema.safeParse({
      type: "line",
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      lineStyle: "braille",
    });
    expect(result.success).toBe(true);
  });

  it("should accept dots style", () => {
    const result = chartInputSchema.safeParse({
      type: "line",
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      lineStyle: "dots",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid line style", () => {
    const result = chartInputSchema.safeParse({
      type: "line",
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      lineStyle: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should default to blocks style", () => {
    const result = chartInputSchema.parse({
      type: "line",
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
    });
    expect(result.lineStyle).toBe("blocks");
  });
});
