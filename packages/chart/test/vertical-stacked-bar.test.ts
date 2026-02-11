import { describe, it, expect } from "vitest";
import { createChart } from "../src/index.js";

describe("Vertical Stacked Bar Chart", () => {
  const chart = createChart();

  const defaultInput = {
    type: "bar-stacked-vertical" as const,
    series: [
      {
        name: "Product A",
        data: [
          { x: "Q1", y: 30 },
          { x: "Q2", y: 40 },
          { x: "Q3", y: 35 },
        ],
      },
      {
        name: "Product B",
        data: [
          { x: "Q1", y: 25 },
          { x: "Q2", y: 30 },
          { x: "Q3", y: 45 },
        ],
      },
      {
        name: "Product C",
        data: [
          { x: "Q1", y: 20 },
          { x: "Q2", y: 15 },
          { x: "Q3", y: 25 },
        ],
      },
    ],
    height: 10,
    width: 40,
  };

  describe("Y-axis rendering", () => {
    it("should render Y-axis tick marks (┤) at label positions", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find lines with numeric labels - they should have tick marks
      const tickLines = lines.filter((line) => /^\d+\s*┤/.test(line.trim()));
      expect(tickLines.length).toBeGreaterThan(0);
    });

    it("should render vertical bars (│) on rows without tick labels", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find lines without numeric labels but with vertical bar
      const nonTickLines = lines.filter(
        (line) => /^\s+│/.test(line) && !/^\d/.test(line.trim())
      );
      expect(nonTickLines.length).toBeGreaterThan(0);
    });

    it("should place zero label on the X-axis line with origin character", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find the X-axis line (contains └)
      const xAxisLine = lines.find((line) => line.includes("└"));
      expect(xAxisLine).toBeDefined();
      expect(xAxisLine).toMatch(/0\s*└/);
    });
  });

  describe("X-axis rendering", () => {
    it("should render X-axis tick marks (┬) under each category", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find the X-axis line
      const xAxisLine = lines.find((line) => line.includes("└"));
      expect(xAxisLine).toBeDefined();

      // Should have tick marks for each category (Q1, Q2, Q3)
      const tickCount = (xAxisLine!.match(/┬/g) || []).length;
      expect(tickCount).toBe(3);
    });

    it("should center category labels under tick marks", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find the X-axis line and the label line
      const xAxisLineIndex = lines.findIndex((line) => line.includes("└"));
      expect(xAxisLineIndex).toBeGreaterThan(-1);

      const labelLine = lines[xAxisLineIndex + 1];
      expect(labelLine).toBeDefined();
      expect(labelLine).toContain("Q1");
      expect(labelLine).toContain("Q2");
      expect(labelLine).toContain("Q3");

      // Labels should be roughly centered (not left-aligned)
      // The label line should have leading spaces before Q1
      expect(labelLine).toMatch(/^\s+Q1/);
    });
  });

  describe("markdown mode", () => {
    it("should render Y-axis tick marks in markdown mode", () => {
      const result = chart.render(defaultInput, { renderMode: "markdown", width: 80 });
      const lines = result.output.split("\n");

      // Find lines with tick marks (accounting for anchor character)
      const tickLines = lines.filter((line) => line.includes("┤"));
      expect(tickLines.length).toBeGreaterThan(0);
    });

    it("should render X-axis tick marks in markdown mode", () => {
      const result = chart.render(defaultInput, { renderMode: "markdown", width: 80 });
      const lines = result.output.split("\n");

      // Find the X-axis line
      const xAxisLine = lines.find((line) => line.includes("└"));
      expect(xAxisLine).toBeDefined();
      expect(xAxisLine).toContain("┬");
    });

    it("should use backticks for second series in markdown mode", () => {
      const result = chart.render(defaultInput, { renderMode: "markdown", width: 80 });

      // Legend should show backticks for Product B
      expect(result.output).toContain("`█`");
      expect(result.output).toContain("Product B");
    });
  });

  describe("stacking order", () => {
    it("should stack segments from bottom to top", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });
      const lines = result.output.split("\n");

      // Find data rows (those with bar characters)
      const dataLines = lines.filter(
        (line) => line.includes("█") || line.includes("▓")
      );
      expect(dataLines.length).toBeGreaterThan(0);

      // Product C (third series) should use shaded character ▓
      // and appear at the top of the stack
      const hasShaded = dataLines.some((line) => line.includes("▓"));
      expect(hasShaded).toBe(true);
    });

    it("should render all three series in the legend", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });

      expect(result.output).toContain("Product A");
      expect(result.output).toContain("Product B");
      expect(result.output).toContain("Product C");
    });
  });

  describe("series styling", () => {
    it("should use solid block for first series", () => {
      const twoSeriesInput = {
        type: "bar-stacked-vertical" as const,
        series: [
          { name: "Series A", data: [{ x: "Q1", y: 50 }] },
          { name: "Series B", data: [{ x: "Q1", y: 50 }] },
        ],
        height: 8,
        width: 30,
      };

      const result = chart.render(twoSeriesInput, { renderMode: "ansi", width: 80 });
      expect(result.output).toContain("█");
    });

    it("should differentiate two series using inline code style in markdown", () => {
      const twoSeriesInput = {
        type: "bar-stacked-vertical" as const,
        series: [
          { name: "Revenue", data: [{ x: "Q1", y: 50 }] },
          { name: "Costs", data: [{ x: "Q1", y: 30 }] },
        ],
        height: 8,
        width: 30,
      };

      const result = chart.render(twoSeriesInput, { renderMode: "markdown", width: 80 });

      // First series: plain block in legend
      expect(result.output).toMatch(/█ Revenue/);
      // Second series: backtick block in legend
      expect(result.output).toMatch(/`█` Costs/);
    });

    it("should use shaded block for third series", () => {
      const result = chart.render(defaultInput, { renderMode: "ansi", width: 80 });

      // Third series uses ▓ character
      expect(result.output).toContain("▓");
      expect(result.output).toContain("Product C");
    });
  });

  describe("edge cases", () => {
    it("should handle single category", () => {
      const singleCategoryInput = {
        type: "bar-stacked-vertical" as const,
        series: [
          { name: "A", data: [{ x: "Only", y: 100 }] },
          { name: "B", data: [{ x: "Only", y: 50 }] },
        ],
        height: 8,
        width: 25,
      };

      const result = chart.render(singleCategoryInput, { renderMode: "ansi", width: 80 });
      expect(result.output).toContain("Only");
      expect(result.output).toContain("└");
      // Should have exactly one tick mark
      const xAxisLine = result.output.split("\n").find((l) => l.includes("└"));
      expect((xAxisLine?.match(/┬/g) || []).length).toBe(1);
    });

    it("should handle long category labels", () => {
      const longLabelInput = {
        type: "bar-stacked-vertical" as const,
        series: [
          {
            name: "Data",
            data: [
              { x: "January", y: 30 },
              { x: "February", y: 40 },
            ],
          },
        ],
        height: 8,
        width: 40,
      };

      const result = chart.render(longLabelInput, { renderMode: "ansi", width: 80 });
      expect(result.output).toContain("January");
      expect(result.output).toContain("February");
    });

    it("should handle zero values in series", () => {
      const zeroValueInput = {
        type: "bar-stacked-vertical" as const,
        series: [
          { name: "A", data: [{ x: "Q1", y: 0 }, { x: "Q2", y: 50 }] },
          { name: "B", data: [{ x: "Q1", y: 100 }, { x: "Q2", y: 0 }] },
        ],
        height: 8,
        width: 30,
      };

      const result = chart.render(zeroValueInput, { renderMode: "ansi", width: 80 });
      expect(result.output).toContain("Q1");
      expect(result.output).toContain("Q2");
      // Should still render without errors
      expect(result.lineCount).toBeGreaterThan(0);
    });
  });
});
