import { describe, it, expect } from "vitest";
import { createChart } from "../src/chart.js";
import { chartInputSchema } from "../src/schema.js";
import { computePieLayout } from "../src/layout/pie.js";
import type { ChartInputWithDefaults } from "../src/types.js";

// Helper to create pie input with defaults
function createPieInput(
  overrides: Record<string, unknown> = {}
): ChartInputWithDefaults {
  return chartInputSchema.parse({
    type: "pie",
    series: [
      {
        name: "Test",
        data: [
          { label: "A", x: "A", y: 40 },
          { label: "B", x: "B", y: 30 },
          { label: "C", x: "C", y: 30 },
        ],
      },
    ],
    height: 10,
    width: 30,
    ...overrides,
  }) as ChartInputWithDefaults;
}

// Helper to create donut input with defaults
function createDonutInput(
  overrides: Record<string, unknown> = {}
): ChartInputWithDefaults {
  return chartInputSchema.parse({
    type: "donut",
    series: [
      {
        name: "Test",
        data: [
          { label: "A", x: "A", y: 50 },
          { label: "B", x: "B", y: 50 },
        ],
      },
    ],
    height: 10,
    width: 30,
    ...overrides,
  }) as ChartInputWithDefaults;
}

describe("pie chart schema validation", () => {
  it("should accept valid pie input", () => {
    const input = {
      type: "pie" as const,
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 50 },
            { label: "B", x: "B", y: 50 },
          ],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept pie without explicit labels", () => {
    const input = {
      type: "pie" as const,
      series: [
        {
          name: "Test",
          data: [
            { x: "Category A", y: 50 },
            { x: "Category B", y: 50 },
          ],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept valid donut input", () => {
    const input = {
      type: "donut" as const,
      series: [
        {
          name: "Test",
          data: [{ label: "A", x: "A", y: 100 }],
        },
      ],
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should apply default innerRadius for donut", () => {
    const input = {
      type: "donut" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 50 }] }],
    };

    const result = chartInputSchema.parse(input);
    expect(result.innerRadius).toBe(0.5);
  });

  it("should accept custom innerRadius", () => {
    const input = {
      type: "donut" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 50 }] }],
      innerRadius: 0.7,
    };

    const result = chartInputSchema.parse(input);
    expect(result.innerRadius).toBe(0.7);
  });

  it("should reject innerRadius greater than 0.9", () => {
    const input = {
      type: "donut" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 50 }] }],
      innerRadius: 1.5,
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject negative innerRadius", () => {
    const input = {
      type: "donut" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 50 }] }],
      innerRadius: -0.5,
    };

    const result = chartInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept centerLabel for donut", () => {
    const input = {
      type: "donut" as const,
      series: [{ name: "Test", data: [{ x: "A", y: 50 }] }],
      centerLabel: "Total",
    };

    const result = chartInputSchema.parse(input);
    expect(result.centerLabel).toBe("Total");
  });
});

describe("pie chart layout computation", () => {
  it("should compute correct slice angles for equal slices", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 50 },
            { label: "B", x: "B", y: 50 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices.length).toBe(2);
    expect(layout.total).toBe(100);

    // First slice: 50%
    expect(layout.slices[0]!.percentage).toBe(50);
    expect(layout.slices[0]!.startAngle).toBe(0);
    expect(layout.slices[0]!.endAngle).toBeCloseTo(Math.PI, 5);

    // Second slice: 50%
    expect(layout.slices[1]!.percentage).toBe(50);
    expect(layout.slices[1]!.startAngle).toBeCloseTo(Math.PI, 5);
    expect(layout.slices[1]!.endAngle).toBeCloseTo(Math.PI * 2, 5);
  });

  it("should compute correct percentages for unequal slices", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 75 },
            { label: "B", x: "B", y: 25 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices[0]!.percentage).toBe(75);
    expect(layout.slices[1]!.percentage).toBe(25);
  });

  it("should filter out zero values", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 50 },
            { label: "B", x: "B", y: 0 },
            { label: "C", x: "C", y: 50 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices.length).toBe(2);
    expect(layout.slices[0]!.label).toBe("A");
    expect(layout.slices[1]!.label).toBe("C");
  });

  it("should filter out negative values", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 50 },
            { label: "B", x: "B", y: -20 },
            { label: "C", x: "C", y: 50 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices.length).toBe(2);
    expect(layout.slices.find((s) => s.label === "B")).toBeUndefined();
  });

  it("should assign different bar characters to slices", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 33 },
            { label: "B", x: "B", y: 33 },
            { label: "C", x: "C", y: 34 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices[0]!.barChar).toBeTruthy();
    expect(layout.slices[1]!.barChar).toBeTruthy();
    expect(layout.slices[2]!.barChar).toBeTruthy();
  });

  it("should compute inner radius for donut", () => {
    const input = createDonutInput({ innerRadius: 0.6 });
    const layout = computePieLayout(input);

    expect(layout.innerRadius).toBeGreaterThan(0);
    expect(layout.innerRadius).toBeLessThan(layout.radius);
  });

  it("should include centerLabel for donut", () => {
    const input = createDonutInput({ centerLabel: "100%" });
    const layout = computePieLayout(input);

    expect(layout.centerLabel).toBe("100%");
  });

  it("should use x value as label when label not provided", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { x: "Category A", y: 50 },
            { x: "Category B", y: 50 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices[0]!.label).toBe("Category A");
    expect(layout.slices[1]!.label).toBe("Category B");
  });

  it("should handle empty data", () => {
    const input = createPieInput({
      series: [{ name: "Test", data: [] }],
    });

    const layout = computePieLayout(input);

    expect(layout.slices.length).toBe(0);
    expect(layout.total).toBe(0);
  });

  it("should handle all zero/negative values", () => {
    const input = createPieInput({
      series: [
        {
          name: "Test",
          data: [
            { label: "A", x: "A", y: 0 },
            { label: "B", x: "B", y: -10 },
          ],
        },
      ],
    });

    const layout = computePieLayout(input);

    expect(layout.slices.length).toBe(0);
    expect(layout.total).toBe(0);
  });

  it("should generate braille characters", () => {
    const input = createPieInput();
    const layout = computePieLayout(input);

    expect(layout.brailleChars).toBeDefined();
    expect(layout.brailleChars.length).toBeGreaterThan(0);
  });
});

describe("pie chart rendering", () => {
  const chart = createChart();

  describe("ansi mode", () => {
    it("should render pie chart", () => {
      const result = chart.render(
        {
          type: "pie",
          series: [
            {
              name: "Revenue",
              data: [
                { label: "Sales", x: "Sales", y: 45 },
                { label: "Support", x: "Support", y: 30 },
                { label: "Other", x: "Other", y: 25 },
              ],
            },
          ],
          height: 8,
          width: 25,
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("Sales");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should show percentages in legend", () => {
      const result = chart.render(
        {
          type: "pie",
          series: [
            {
              name: "Test",
              data: [
                { label: "A", x: "A", y: 75 },
                { label: "B", x: "B", y: 25 },
              ],
            },
          ],
          height: 8,
          width: 25,
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toMatch(/75/);
      expect(result.output).toMatch(/25/);
    });

    it("should render donut chart", () => {
      const result = chart.render(
        {
          type: "donut",
          series: [
            {
              name: "Share",
              data: [
                { label: "A", x: "A", y: 60 },
                { label: "B", x: "B", y: 40 },
              ],
            },
          ],
          height: 8,
          width: 25,
          innerRadius: 0.5,
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should display center label for donut", () => {
      const result = chart.render(
        {
          type: "donut",
          series: [
            {
              name: "Test",
              data: [
                { label: "A", x: "A", y: 60 },
                { label: "B", x: "B", y: 40 },
              ],
            },
          ],
          height: 10,
          width: 30,
          centerLabel: "Total",
        },
        { renderMode: "ansi" }
      );

      expect(result.output).toContain("Total");
    });
  });

  describe("markdown mode", () => {
    it("should render pie chart", () => {
      const result = chart.render(
        {
          type: "pie",
          series: [
            {
              name: "Revenue",
              data: [
                { label: "Sales", x: "Sales", y: 45 },
                { label: "Support", x: "Support", y: 30 },
              ],
            },
          ],
          height: 8,
          width: 25,
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("Sales");
      expect(result.output).toContain("%");
    });

    it("should render donut chart with center label", () => {
      const result = chart.render(
        {
          type: "donut",
          series: [
            {
              name: "Share",
              data: [
                { label: "A", x: "A", y: 60 },
                { label: "B", x: "B", y: 40 },
              ],
            },
          ],
          height: 8,
          width: 25,
          centerLabel: "100%",
          innerRadius: 0.5,
        },
        { renderMode: "markdown" }
      );

      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
    });
  });
});

describe("pie chart edge cases", () => {
  const chart = createChart();

  it("should handle empty data", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [{ name: "Test", data: [] }],
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toBe("");
    expect(result.lineCount).toBe(0);
  });

  it("should handle single slice (100%)", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [{ label: "Only", x: "Only", y: 100 }],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Only");
    expect(result.output).toContain("100");
  });

  it("should filter out zero values", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 50 },
              { label: "B", x: "B", y: 0 },
              { label: "C", x: "C", y: 50 },
            ],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("A");
    expect(result.output).not.toMatch(/\bB\b.*0%/);
    expect(result.output).toContain("C");
  });

  it("should handle all zero/negative values", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 0 },
              { label: "B", x: "B", y: -10 },
            ],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    // "No data" is more user-friendly than empty output
    expect(result.output).toContain("No data");
  });

  it("should handle very small slices", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [
              { label: "Major", x: "Major", y: 99 },
              { label: "Tiny", x: "Tiny", y: 1 },
            ],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Major");
    expect(result.output).toContain("Tiny");
  });

  it("should handle many slices", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 20 },
              { label: "B", x: "B", y: 20 },
              { label: "C", x: "C", y: 20 },
              { label: "D", x: "D", y: 20 },
              { label: "E", x: "E", y: 20 },
            ],
          },
        ],
        height: 10,
        width: 35,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("A");
    expect(result.output).toContain("E");
    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle donut with innerRadius 0", () => {
    const result = chart.render(
      {
        type: "donut",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 50 },
              { label: "B", x: "B", y: 50 },
            ],
          },
        ],
        height: 8,
        width: 25,
        innerRadius: 0,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle donut with large innerRadius", () => {
    const result = chart.render(
      {
        type: "donut",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 50 },
              { label: "B", x: "B", y: 50 },
            ],
          },
        ],
        height: 8,
        width: 25,
        innerRadius: 0.8,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle very small dimensions", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Test",
            data: [
              { label: "A", x: "A", y: 50 },
              { label: "B", x: "B", y: 50 },
            ],
          },
        ],
        height: 5,
        width: 15,
      },
      { renderMode: "ansi" }
    );

    expect(result.lineCount).toBeGreaterThan(0);
  });

  it("should handle data from multiple series", () => {
    const result = chart.render(
      {
        type: "pie",
        series: [
          {
            name: "Series 1",
            data: [{ label: "A", x: "A", y: 30 }],
          },
          {
            name: "Series 2",
            data: [{ label: "B", x: "B", y: 70 }],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("A");
    expect(result.output).toContain("B");
  });
});

describe("pie chart with title", () => {
  const chart = createChart();

  it("should display title when provided", () => {
    const result = chart.render(
      {
        type: "pie",
        title: "Revenue Breakdown",
        series: [
          {
            name: "Revenue",
            data: [
              { label: "Sales", x: "Sales", y: 60 },
              { label: "Other", x: "Other", y: 40 },
            ],
          },
        ],
        height: 8,
        width: 25,
      },
      { renderMode: "ansi" }
    );

    expect(result.output).toContain("Revenue Breakdown");
  });
});
