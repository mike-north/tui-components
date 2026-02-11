import { describe, it, expect } from "vitest";
import { createChart } from "../src/chart.js";
import { chartInputSchema } from "../src/schema.js";
import { computeHeatmapLayout } from "../src/layout/heatmap.js";
import type { ChartInputWithDefaults } from "../src/types.js";

// Helper to create heatmap input with defaults
function createHeatmapInput(
  overrides: Record<string, unknown> = {}
): ChartInputWithDefaults {
  return chartInputSchema.parse({
    type: "heatmap",
    series: [
      {
        name: "Activity",
        data: [
          { x: "Mon", y: 10, label: "9am" },
          { x: "Tue", y: 20, label: "9am" },
          { x: "Mon", y: 30, label: "10am" },
          { x: "Tue", y: 40, label: "10am" },
        ],
      },
    ],
    height: 6,
    width: 20,
    ...overrides,
  }) as ChartInputWithDefaults;
}

describe("heatmap chart schema validation", () => {
  it("should accept valid heatmap input", () => {
    const input = {
      type: "heatmap" as const,
      series: [
        {
          name: "Activity",
          data: [
            { x: "Mon", y: 10, label: "9am" },
            { x: "Tue", y: 20, label: "9am" },
          ],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should apply default heatmapStyle", () => {
    const input = {
      type: "heatmap" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 10, label: "L" }] }],
    };

    const result = chartInputSchema.parse(input);
    expect(result.heatmapStyle).toBe("blocks");
  });

  it("should accept ascii heatmapStyle", () => {
    const input = {
      type: "heatmap" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 10, label: "L" }] }],
      heatmapStyle: "ascii",
    };

    const result = chartInputSchema.parse(input);
    expect(result.heatmapStyle).toBe("ascii");
  });

  it("should accept numeric heatmapStyle", () => {
    const input = {
      type: "heatmap" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 10, label: "L" }] }],
      heatmapStyle: "numeric",
    };

    const result = chartInputSchema.parse(input);
    expect(result.heatmapStyle).toBe("numeric");
  });

  it("should reject invalid heatmapStyle", () => {
    const input = {
      type: "heatmap" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 10 }] }],
      heatmapStyle: "invalid",
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should use series name as row label when label not provided", () => {
    const input = {
      type: "heatmap" as const,
      series: [
        {
          name: "Row1",
          data: [{ x: "Col1", y: 50 }],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("heatmap chart layout computation", () => {
  it("should extract row and column labels", () => {
    const input = createHeatmapInput();
    const layout = computeHeatmapLayout(input);

    expect(layout.colLabels).toContain("Mon");
    expect(layout.colLabels).toContain("Tue");
    expect(layout.rowLabels).toContain("9am");
    expect(layout.rowLabels).toContain("10am");
  });

  it("should compute correct value range", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 10, label: "L1" },
            { x: "B", y: 90, label: "L1" },
            { x: "A", y: 50, label: "L2" },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    expect(layout.valueRange.min).toBe(10);
    expect(layout.valueRange.max).toBe(90);
  });

  it("should normalize cell values correctly", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 0, label: "L1" },
            { x: "B", y: 50, label: "L1" },
            { x: "C", y: 100, label: "L1" },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    // Min value (0) should normalize to 0
    const minCell = layout.cells[0]!.find((c) => c.value === 0);
    expect(minCell?.normalizedValue).toBeCloseTo(0, 5);

    // Max value (100) should normalize to 1
    const maxCell = layout.cells[0]!.find((c) => c.value === 100);
    expect(maxCell?.normalizedValue).toBeCloseTo(1, 5);

    // Mid value (50) should normalize to 0.5
    const midCell = layout.cells[0]!.find((c) => c.value === 50);
    expect(midCell?.normalizedValue).toBeCloseTo(0.5, 5);
  });

  it("should assign display characters for blocks style", () => {
    const input = createHeatmapInput({ heatmapStyle: "blocks" });
    const layout = computeHeatmapLayout(input);

    expect(layout.cells[0]![0]!.displayChar).toBeTruthy();
    expect(layout.cells[0]![1]!.displayChar).toBeTruthy();
  });

  it("should assign display characters for ascii style", () => {
    const input = createHeatmapInput({ heatmapStyle: "ascii" });
    const layout = computeHeatmapLayout(input);

    // ASCII style uses characters like . : * #
    expect(layout.cells[0]![0]!.displayChar).toMatch(/[.:\*# ]+/);
  });

  it("should format values for numeric style", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 10, label: "L1" },
            { x: "B", y: 99, label: "L1" },
          ],
        },
      ],
      heatmapStyle: "numeric",
    });

    const layout = computeHeatmapLayout(input);

    expect(layout.cells[0]![0]!.displayChar).toBe("10");
    expect(layout.cells[0]![1]!.displayChar).toBe("99");
  });

  it("should fill missing cells with zero", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 10, label: "L1" },
            // Missing B/L1
            { x: "A", y: 20, label: "L2" },
            { x: "B", y: 30, label: "L2" },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    // Grid should be 2 rows x 2 cols
    expect(layout.cells.length).toBe(2);
    expect(layout.cells[0]!.length).toBe(2);

    // Find the missing cell (L1/B)
    const l1Row = layout.rowLabels.indexOf("L1");
    const bCol = layout.colLabels.indexOf("B");
    const missingCell = layout.cells[l1Row]![bCol];
    expect(missingCell!.value).toBe(0);
  });

  it("should handle empty data", () => {
    const input = createHeatmapInput({
      series: [{ name: "Test", data: [] }],
    });

    const layout = computeHeatmapLayout(input);

    expect(layout.cells.length).toBe(0);
    expect(layout.rowLabels.length).toBe(0);
    expect(layout.colLabels.length).toBe(0);
  });

  it("should handle all same values", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A", y: 50, label: "L1" },
            { x: "B", y: 50, label: "L1" },
            { x: "A", y: 50, label: "L2" },
            { x: "B", y: 50, label: "L2" },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    // All cells should have normalized value of 0.5 (middle)
    for (const row of layout.cells) {
      for (const cell of row) {
        expect(cell.normalizedValue).toBeCloseTo(0.5, 5);
      }
    }
  });

  it("should use series name as row label when label not provided", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "SeriesRow",
          data: [
            { x: "Col1", y: 10 },
            { x: "Col2", y: 20 },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    expect(layout.rowLabels).toContain("SeriesRow");
  });

  it("should handle labels with special characters", () => {
    const input = createHeatmapInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "A:B", y: 10, label: "X:Y" },
            { x: "C:D", y: 20, label: "X:Y" },
          ],
        },
      ],
    });

    const layout = computeHeatmapLayout(input);

    // Should handle colons in labels without key collision
    expect(layout.colLabels).toContain("A:B");
    expect(layout.colLabels).toContain("C:D");
    expect(layout.rowLabels).toContain("X:Y");
  });
});

describe("heatmap chart rendering", () => {
  const chart = createChart();

  describe("ansi mode", () => {
    it("should render heatmap with blocks style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Activity",
              data: [
                { x: "Mon", y: 10, label: "9am" },
                { x: "Tue", y: 90, label: "9am" },
                { x: "Mon", y: 50, label: "10am" },
                { x: "Tue", y: 70, label: "10am" },
              ],
            },
          ],
          height: 6,
          width: 20,
          heatmapStyle: "blocks",
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("Mon");
      expect(result.output).toContain("Tue");
      expect(result.output).toContain("9am");
      expect(result.output).toContain("10am");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render heatmap with ascii style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Activity",
              data: [
                { x: "A", y: 10, label: "X" },
                { x: "B", y: 90, label: "X" },
              ],
            },
          ],
          height: 4,
          width: 15,
          heatmapStyle: "ascii",
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render heatmap with numeric style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Test",
              data: [
                { x: "A", y: 10, label: "L1" },
                { x: "B", y: 90, label: "L1" },
              ],
            },
          ],
          height: 4,
          width: 20,
          heatmapStyle: "numeric",
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("10");
      expect(result.output).toContain("90");
    });

    it("should show scale legend for blocks style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Test",
              data: [
                { x: "A", y: 0, label: "L" },
                { x: "B", y: 100, label: "L" },
              ],
            },
          ],
          height: 6,
          width: 25,
          heatmapStyle: "blocks",
        },
        { renderMode: "ansi" }
      );

      // Should show scale indicator
      expect(result.output).toMatch(/Low|High|Scale/i);
    });
  });

  describe("markdown mode", () => {
    it("should render heatmap with blocks style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Activity",
              data: [
                { x: "Mon", y: 10, label: "9am" },
                { x: "Tue", y: 90, label: "9am" },
              ],
            },
          ],
          height: 4,
          width: 20,
          heatmapStyle: "blocks",
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("Mon");
      expect(result.output).toContain("Tue");
      expect(result.output).toContain("9am");
    });

    it("should render heatmap with ascii style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Activity",
              data: [
                { x: "A", y: 10, label: "X" },
                { x: "B", y: 90, label: "X" },
              ],
            },
          ],
          height: 4,
          width: 15,
          heatmapStyle: "ascii",
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
    });

    it("should render heatmap with numeric style", () => {
      const result = chart.render(
        {
          type: "heatmap",
          series: [
            {
              name: "Test",
              data: [
                { x: "A", y: 42, label: "L1" },
                { x: "B", y: 99, label: "L1" },
              ],
            },
          ],
          height: 4,
          width: 20,
          heatmapStyle: "numeric",
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("42");
      expect(result.output).toContain("99");
    });
  });
});

describe("heatmap chart edge cases", () => {
  const chart = createChart();

  it("should handle empty data", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [{ name: "Test", data: [] }],
      },
      { renderMode: "ansi" }
    );

    // Empty data should produce empty output
    expect(result.output).toBe("");
  });

  it("should handle single cell", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [{ x: "A", y: 50, label: "L" }],
          },
        ],
        height: 4,
        width: 15,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("A");
    expect(result.output).toContain("L");
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle negative values", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: -50, label: "L1" },
              { x: "B", y: 50, label: "L1" },
            ],
          },
        ],
        height: 4,
        width: 15,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle zero values", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: 0, label: "L1" },
              { x: "B", y: 100, label: "L1" },
            ],
          },
        ],
        height: 4,
        width: 15,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle all same values", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: 50, label: "L1" },
              { x: "B", y: 50, label: "L1" },
              { x: "A", y: 50, label: "L2" },
              { x: "B", y: 50, label: "L2" },
            ],
          },
        ],
        height: 6,
        width: 20,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle sparse data (missing cells)", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "Mon", y: 10, label: "9am" },
              // Missing Tue/9am
              { x: "Wed", y: 30, label: "9am" },
              // Missing all 10am entries except one
              { x: "Tue", y: 50, label: "10am" },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Mon");
    expect(result.output).toContain("Wed");
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle large grids", () => {
    const data = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        data.push({ x: `C${col}`, y: row * 10 + col, label: `R${row}` });
      }
    }

    const result = chart.render(
      {
        type: "heatmap",
        series: [{ name: "Test", data }],
        height: 15,
        width: 40,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle very small dimensions", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: 10, label: "L" },
              { x: "B", y: 90, label: "L" },
            ],
          },
        ],
        height: 3,
        width: 10,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle data from multiple series", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Row1",
            data: [
              { x: "A", y: 10 },
              { x: "B", y: 20 },
            ],
          },
          {
            name: "Row2",
            data: [
              { x: "A", y: 30 },
              { x: "B", y: 40 },
            ],
          },
        ],
        height: 6,
        width: 20,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Row1");
    expect(result.output).toContain("Row2");
    expect(result.output).toContain("A");
    expect(result.output).toContain("B");
  });

  it("should handle long labels", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "VeryLongColumnName", y: 50, label: "VeryLongRowName" },
            ],
          },
        ],
        height: 6,
        width: 40,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle decimal values in numeric mode", () => {
    const result = chart.render(
      {
        type: "heatmap",
        series: [
          {
            name: "Test",
            data: [
              { x: "A", y: 3.14159, label: "L" },
              { x: "B", y: 2.71828, label: "L" },
            ],
          },
        ],
        height: 4,
        width: 25,
        heatmapStyle: "numeric",
      },
      { renderMode: "ansi" }
    );

    // Should format decimals appropriately
    expect(result.output).toMatch(/3\.1|3\.14/);
    expect(result.output).toMatch(/2\.7|2\.71/);
  });
});

describe("heatmap chart with title", () => {
  const chart = createChart();

  it("should display title when provided", () => {
    const result = chart.render(
      {
        type: "heatmap",
        title: "Activity Heatmap",
        series: [
          {
            name: "Activity",
            data: [
              { x: "Mon", y: 50, label: "9am" },
              { x: "Tue", y: 75, label: "9am" },
            ],
          },
        ],
        height: 6,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Activity Heatmap");
  });
});
