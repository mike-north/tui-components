import { describe, it, expect, beforeEach } from "vitest";
import { registry } from "@tuicomponents/core";
import { createChart, ChartComponent, chartInputSchema } from "../src/index.js";

describe("ChartComponent", () => {
  beforeEach(() => {
    registry.clear();
  });

  describe("component registration", () => {
    it("should create a chart component", () => {
      const chart = createChart();
      expect(chart).toBeInstanceOf(ChartComponent);
    });

    it("should have correct metadata", () => {
      const chart = createChart();
      expect(chart.metadata.name).toBe("chart");
      expect(chart.metadata.version).toBe("0.1.0");
      expect(chart.metadata.supportedModes).toContain("ansi");
      expect(chart.metadata.supportedModes).toContain("markdown");
    });

    it("should register with the registry", () => {
      registry.register(createChart);
      expect(registry.has("chart")).toBe(true);
    });

    it("should have multiple examples", () => {
      const chart = createChart();
      expect(chart.metadata.examples.length).toBeGreaterThan(5);
    });
  });

  describe("schema validation", () => {
    it("should accept valid horizontal bar input", () => {
      const input = {
        type: "bar" as const,
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: 10 },
              { x: "B", y: 20 },
            ],
          },
        ],
      };

      const result = chartInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept valid line chart input", () => {
      const input = {
        type: "line" as const,
        series: [
          {
            name: "Test",
            data: [
              { x: 1, y: 10 },
              { x: 2, y: 20 },
            ],
          },
        ],
      };

      const result = chartInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty series", () => {
      const input = {
        type: "bar" as const,
        series: [],
      };

      const result = chartInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid chart type", () => {
      const input = {
        type: "invalid",
        series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      };

      const result = chartInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should apply default values", () => {
      const input = {
        type: "bar" as const,
        series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      };

      const result = chartInputSchema.parse(input);
      expect(result.width).toBe(40);
      expect(result.height).toBe(10);
      expect(result.showValues).toBe(false);
      expect(result.showAxes).toBe(true);
      expect(result.lineStyle).toBe("blocks");
      expect(result.barStyle).toBe("block");
    });
  });

  describe("rendering", () => {
    it("should render horizontal bar chart in ANSI mode", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar",
          series: [
            {
              name: "Test",
              data: [
                { x: "A", y: 10 },
                { x: "B", y: 20 },
              ],
            },
          ],
          showValues: true,
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render horizontal bar chart in markdown mode", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar",
          series: [
            {
              name: "Test",
              data: [
                { x: "A", y: 10 },
                { x: "B", y: 20 },
              ],
            },
          ],
        },
        { renderMode: "markdown", width: 80 }
      );

      expect(result.output).toContain("│"); // Anchor character
      expect(result.output).toContain("A");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render vertical bar chart", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar-vertical",
          series: [
            {
              name: "Test",
              data: [
                { x: "Q1", y: 50 },
                { x: "Q2", y: 75 },
              ],
            },
          ],
          height: 8,
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("Q1");
      expect(result.output).toContain("Q2");
      expect(result.lineCount).toBeGreaterThan(5);
    });

    it("should render stacked bar chart with legend", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar-stacked",
          series: [
            {
              name: "Product A",
              data: [{ x: "Q1", y: 50 }],
            },
            {
              name: "Product B",
              data: [{ x: "Q1", y: 30 }],
            },
          ],
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("Product A");
      expect(result.output).toContain("Product B");
    });

    it("should render line chart", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "line",
          series: [
            {
              name: "Trend",
              data: [
                { x: "J", y: 30 },
                { x: "F", y: 50 },
                { x: "M", y: 40 },
              ],
            },
          ],
          height: 6,
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("│"); // Y-axis
      expect(result.output).toContain("─"); // X-axis
      expect(result.lineCount).toBeGreaterThan(5);
    });

    it("should render area chart", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "area",
          series: [
            {
              name: "Users",
              data: [
                { x: "W1", y: 100 },
                { x: "W2", y: 150 },
              ],
            },
          ],
          height: 6,
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("│");
      expect(result.lineCount).toBeGreaterThan(5);
    });

    it("should render stacked area chart", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "area-stacked",
          series: [
            {
              name: "Mobile",
              data: [{ x: "J", y: 50 }],
            },
            {
              name: "Desktop",
              data: [{ x: "J", y: 100 }],
            },
          ],
          height: 6,
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("Mobile");
      expect(result.output).toContain("Desktop");
    });

    it("should include title when provided", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar",
          series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
          title: "My Chart Title",
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toContain("My Chart Title");
    });

    it("should return empty result for empty data", () => {
      const chart = createChart();
      const result = chart.render(
        {
          type: "bar",
          series: [{ name: "Test", data: [] }],
        },
        { renderMode: "ansi", width: 80 }
      );

      expect(result.output).toBe("");
      expect(result.lineCount).toBe(0);
    });
  });

  describe("JSON schema generation", () => {
    it("should generate valid JSON schema", () => {
      const chart = createChart();
      const schema = chart.getJsonSchema() as Record<string, unknown>;

      // zodToJsonSchema generates a schema with $ref and definitions
      expect(schema).toHaveProperty("$ref");
      expect(schema).toHaveProperty("definitions");
    });
  });
});
