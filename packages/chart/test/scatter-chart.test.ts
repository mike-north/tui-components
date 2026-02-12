import { describe, it, expect } from "vitest";
import { createChart } from "../src/chart.js";
import { chartInputSchema } from "../src/schema.js";
import { computeScatterLayout } from "../src/layout/scatter.js";
import type { ChartInputWithDefaults } from "../src/types.js";

// Helper to create scatter input with defaults
function createScatterInput(
  overrides: Record<string, unknown> = {}
): ChartInputWithDefaults {
  return chartInputSchema.parse({
    type: "scatter",
    series: [
      {
        name: "Test",
        data: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
          { x: 50, y: 60 },
        ],
      },
    ],
    height: 8,
    width: 30,
    ...overrides,
  }) as ChartInputWithDefaults;
}

describe("scatter chart schema validation", () => {
  it("should accept valid scatter input", () => {
    const input = {
      type: "scatter" as const,
      series: [
        {
          name: "Test",
          data: [
            { x: 10, y: 20 },
            { x: 30, y: 40 },
          ],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept scatter chart with string x-values", () => {
    const input = {
      type: "scatter" as const,
      series: [
        {
          name: "Test",
          data: [{ x: "10", y: 20 }],
        },
      ],
    };

    // Schema allows string x, but they'll be parsed at runtime
    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should apply default scatterStyle", () => {
    const input = {
      type: "scatter" as const,
      series: [{ name: "Test", data: [{ x: 1, y: 1 }] }],
    };

    const result = chartInputSchema.parse(input);
    expect(result.scatterStyle).toBe("dots");
  });

  it("should accept braille scatterStyle", () => {
    const input = {
      type: "scatter" as const,
      series: [{ name: "Test", data: [{ x: 1, y: 1 }] }],
      scatterStyle: "braille",
    };

    const result = chartInputSchema.parse(input);
    expect(result.scatterStyle).toBe("braille");
  });

  it("should reject invalid scatterStyle", () => {
    const input = {
      type: "scatter" as const,
      series: [{ name: "Test", data: [{ x: 1, y: 1 }] }],
      scatterStyle: "invalid",
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should apply default dimensions", () => {
    const input = {
      type: "scatter" as const,
      series: [{ name: "Test", data: [{ x: 1, y: 1 }] }],
    };

    const result = chartInputSchema.parse(input);
    expect(result.width).toBe(40);
    expect(result.height).toBe(10);
  });
});

describe("scatter chart layout computation", () => {
  it("should compute correct scales from data", () => {
    const input = createScatterInput({
      series: [
        {
          name: "Test",
          data: [
            { x: 0, y: 0 },
            { x: 100, y: 200 },
          ],
        },
      ],
    });

    const layout = computeScatterLayout(input);

    expect(layout.xScale.min).toBeLessThanOrEqual(0);
    expect(layout.xScale.max).toBeGreaterThanOrEqual(100);
    expect(layout.yScale.min).toBeLessThanOrEqual(0);
    expect(layout.yScale.max).toBeGreaterThanOrEqual(200);
  });

  it("should respect custom axis ranges", () => {
    const input = createScatterInput({
      series: [
        {
          name: "Test",
          data: [
            { x: 50, y: 50 },
            { x: 75, y: 75 },
          ],
        },
      ],
      xAxis: { min: 0, max: 150 },
      yAxis: { min: 0, max: 150 },
    });

    const layout = computeScatterLayout(input);

    expect(layout.xScale.min).toBe(0);
    expect(layout.xScale.max).toBe(150);
    expect(layout.yScale.min).toBe(0);
    expect(layout.yScale.max).toBe(150);
  });

  it("should map data points to character positions", () => {
    const input = createScatterInput({
      series: [
        {
          name: "Test",
          data: [{ x: 50, y: 50 }],
        },
      ],
      xAxis: { min: 0, max: 100 },
      yAxis: { min: 0, max: 100 },
    });

    const layout = computeScatterLayout(input);

    expect(layout.points.length).toBe(1);
    const point = layout.points[0]!;
    expect(point.dataX).toBe(50);
    expect(point.dataY).toBe(50);
    expect(point.charX).toBeGreaterThanOrEqual(0);
    expect(point.charX).toBeLessThan(layout.chartWidth);
    expect(point.charY).toBeGreaterThanOrEqual(0);
    expect(point.charY).toBeLessThan(layout.chartHeight);
  });

  it("should filter non-numeric x values", () => {
    const input = createScatterInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "invalid", y: 10 },
            { x: 50, y: 50 },
          ],
        },
      ],
    });

    const layout = computeScatterLayout(input);

    // Only the valid point should be in layout
    expect(layout.points.length).toBe(1);
    expect(layout.points[0]!.dataX).toBe(50);
  });

  it("should parse numeric strings as x values", () => {
    const input = createScatterInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "25", y: 10 },
            { x: 50, y: 50 },
          ],
        },
      ],
    });

    const layout = computeScatterLayout(input);

    expect(layout.points.length).toBe(2);
    expect(layout.points[0]!.dataX).toBe(25);
  });

  it("should assign series indices correctly", () => {
    const input = createScatterInput({
      series: [
        { name: "Series A", data: [{ x: 10, y: 20 }] },
        { name: "Series B", data: [{ x: 30, y: 40 }] },
        { name: "Series C", data: [{ x: 50, y: 60 }] },
      ],
    });

    const layout = computeScatterLayout(input);

    expect(layout.points.length).toBe(3);
    expect(layout.points[0]!.seriesIndex).toBe(0);
    expect(layout.points[1]!.seriesIndex).toBe(1);
    expect(layout.points[2]!.seriesIndex).toBe(2);
  });

  it("should create grid for dots mode", () => {
    const input = createScatterInput({ scatterStyle: "dots" });
    const layout = computeScatterLayout(input);

    expect(layout.scatterStyle).toBe("dots");
    expect(layout.grid).toBeDefined();
    expect(layout.seriesIndices).toBeDefined();
    expect(layout.grid!.length).toBe(layout.chartHeight);
  });

  it("should create braille chars for braille mode", () => {
    const input = createScatterInput({ scatterStyle: "braille" });
    const layout = computeScatterLayout(input);

    expect(layout.scatterStyle).toBe("braille");
    expect(layout.brailleChars).toBeDefined();
    expect(layout.brailleSeriesIndices).toBeDefined();
  });

  it("should handle empty data", () => {
    const input = createScatterInput({
      series: [{ name: "Test", data: [] }],
    });

    const layout = computeScatterLayout(input);

    expect(layout.points.length).toBe(0);
    // Should still have valid scales
    expect(layout.xScale).toBeDefined();
    expect(layout.yScale).toBeDefined();
  });
});

describe("scatter chart rendering", () => {
  const chart = createChart();

  describe("ansi mode", () => {
    it("should render scatter chart", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [
            {
              name: "Data",
              data: [
                { x: 10, y: 20 },
                { x: 50, y: 50 },
              ],
            },
          ],
          height: 6,
          width: 25,
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("│");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render with braille style", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [
            {
              name: "Data",
              data: [
                { x: 10, y: 20 },
                { x: 50, y: 50 },
                { x: 90, y: 80 },
              ],
            },
          ],
          height: 6,
          width: 25,
          scatterStyle: "braille",
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("│");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should use braille characters in braille mode", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [{ name: "Data", data: [{ x: 50, y: 50 }] }],
          height: 6,
          width: 25,
          scatterStyle: "braille",
        },
        { renderMode: "ansi" }
      );

      // Check for braille characters (U+2800-U+28FF range)
      const hasBraille = Array.from(result.output).some((char) => {
        const code = char.charCodeAt(0);
        return code >= 0x2800 && code <= 0x28ff;
      });
      expect(hasBraille).toBe(true);
    });

    it("should not show legend for single series (standard behavior)", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [{ name: "My Data", data: [{ x: 50, y: 50 }] }],
          height: 6,
          width: 25,
        },
        { renderMode: "ansi" }
      );

      // Single series charts don't need a legend - the data point should render
      expect(result.output).toContain("●");
      // Legend is only shown for multi-series
      expect(result.output).not.toContain("My Data");
    });

    it("should show multiple series in legend", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [
            { name: "Series A", data: [{ x: 20, y: 30 }] },
            { name: "Series B", data: [{ x: 50, y: 60 }] },
            { name: "Series C", data: [{ x: 80, y: 90 }] },
          ],
          height: 6,
          width: 30,
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("Series A");
      expect(result.output).toContain("Series B");
      expect(result.output).toContain("Series C");
    });
  });

  describe("markdown mode", () => {
    it("should render scatter chart", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [
            {
              name: "Data",
              data: [
                { x: 10, y: 20 },
                { x: 50, y: 50 },
              ],
            },
          ],
          height: 6,
          width: 25,
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("│");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render with braille style in markdown", () => {
      const result = chart.render(
        {
          type: "scatter",
          series: [{ name: "Data", data: [{ x: 50, y: 50 }] }],
          height: 6,
          width: 25,
          scatterStyle: "braille",
        },
        { renderMode: "markdown" }
      );

      expect(result.lineCount).toBeGreaterThan(0);
    });
  });
});

describe("scatter chart edge cases", () => {
  const chart = createChart();

  it("should handle empty data", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [] }],
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toBe("");
    expect(result.lineCount).toBe(0);
  });

  it("should handle single data point", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 50, y: 50 }] }],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("●");
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle negative values", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Test",
            data: [
              { x: -10, y: -20 },
              { x: 30, y: 50 },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle zero values", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Test",
            data: [
              { x: 0, y: 0 },
              { x: 100, y: 100 },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle overlapping points from different series", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          { name: "Series A", data: [{ x: 50, y: 50 }] },
          { name: "Series B", data: [{ x: 50, y: 50 }] },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    // Should show both series in legend even if points overlap
    expect(result.output).toContain("Series A");
    expect(result.output).toContain("Series B");
  });

  it("should handle large value ranges", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Test",
            data: [
              { x: 1, y: 1 },
              { x: 1000000, y: 1000000 },
            ],
          },
        ],
        height: 8,
        width: 30,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle multiple series with different point counts", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Series A",
            data: [
              { x: 10, y: 20 },
              { x: 20, y: 30 },
              { x: 30, y: 40 },
            ],
          },
          { name: "Series B", data: [{ x: 50, y: 50 }] },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Series A");
    expect(result.output).toContain("Series B");
  });

  it("should handle all invalid x values gracefully", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [
          {
            name: "Test",
            data: [
              { x: "invalid", y: 10 },
              { x: "also-invalid", y: 20 },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    // When all x values are invalid, axes still render (empty chart)
    expect(result.lineCount).toBeGreaterThan(0);
    // No data points should be plotted
    expect(result.output).not.toContain("●");
  });

  it("should handle very small dimensions", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 50, y: 50 }] }],
        height: 4,
        width: 15,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });
});

describe("scatter chart axis configuration", () => {
  const chart = createChart();

  it("should respect custom X-axis range", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 50, y: 50 }] }],
        xAxis: { min: 0, max: 100 },
        height: 8,
        width: 40, // Larger width to fit all X-axis tick labels
      },
      { renderMode: "ansi" }
    );

    // Should show tick values from the forced range
    expect(result.output).toMatch(/0/);
    expect(result.output).toMatch(/100/);
  });

  it("should respect custom Y-axis range", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 50, y: 50 }] }],
        yAxis: { min: 0, max: 200 },
        height: 12, // Larger height to show all Y-axis ticks
        width: 30,
      },
      { renderMode: "ansi" }
    );

    // Should show 200 as the max Y value from the forced range
    expect(result.output).toMatch(/200/);
  });

  it("should support custom tick count", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 50, y: 50 }] }],
        xAxis: { tickCount: 3 },
        yAxis: { tickCount: 3 },
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should support compact value formatting", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 1000, y: 2000 }] }],
        yAxis: { format: "compact" },
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    // Should show compact format (K suffix)
    expect(result.output).toMatch(/K/);
  });

  it("should support percent value formatting", () => {
    const result = chart.render(
      {
        type: "scatter",
        series: [{ name: "Test", data: [{ x: 0.5, y: 0.75 }] }],
        yAxis: { format: "percent", min: 0, max: 1 },
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toMatch(/%/);
  });
});

describe("scatter chart with title", () => {
  const chart = createChart();

  it("should display title when provided", () => {
    const result = chart.render(
      {
        type: "scatter",
        title: "My Scatter Plot",
        series: [{ name: "Data", data: [{ x: 50, y: 50 }] }],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("My Scatter Plot");
  });
});
