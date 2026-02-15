import { describe, it, expect } from "vitest";
import {
  renderBarChartInline,
  renderStackedBarChartInline,
  renderChartSummaryInline,
} from "../src/renderers/markdown-inline.js";
import type { BarChartLayout } from "../src/layout/bar.js";
import type { StackedBarChartLayout } from "../src/layout/stacked-bar.js";

describe("renderBarChartInline", () => {
  it("should render bars separated by pipes", () => {
    const layout: BarChartLayout = {
      type: "bar",
      bars: [
        {
          seriesIndex: 0,
          pointIndex: 0,
          label: "Q1",
          value: 25,
          length: 5,
          formattedValue: "25",
          barChar: "█",
          useBackticks: false,
          percentage: 25,
        },
        {
          seriesIndex: 0,
          pointIndex: 1,
          label: "Q2",
          value: 75,
          length: 15,
          formattedValue: "75",
          barChar: "█",
          useBackticks: false,
          percentage: 75,
        },
      ],
      categories: ["Q1", "Q2"],
      maxLabelWidth: 2,
      maxValueWidth: 2,
      barAreaSize: 20,
      yScale: { min: 0, max: 100, ticks: [0, 50, 100] },
      showValues: true,
      width: 40,
      height: 2,
    };

    const result = renderBarChartInline(layout);
    expect(result).toContain("Q1:");
    expect(result).toContain("Q2:");
    expect(result).toContain(" | ");
    expect(result).toContain("25");
    expect(result).toContain("75");
  });

  it("should hide values when showValues is false", () => {
    const layout: BarChartLayout = {
      type: "bar",
      bars: [
        {
          seriesIndex: 0,
          pointIndex: 0,
          label: "A",
          value: 50,
          length: 10,
          formattedValue: "50",
          barChar: "█",
          useBackticks: false,
          percentage: 50,
        },
      ],
      categories: ["A"],
      maxLabelWidth: 1,
      maxValueWidth: 2,
      barAreaSize: 20,
      yScale: { min: 0, max: 100, ticks: [0, 50, 100] },
      showValues: false,
      width: 40,
      height: 1,
    };

    const result = renderBarChartInline(layout);
    expect(result).not.toContain("50");
    expect(result).toContain("A:");
    expect(result).toContain("█");
  });

  it("should scale bars to max 10 characters", () => {
    const layout: BarChartLayout = {
      type: "bar",
      bars: [
        {
          seriesIndex: 0,
          pointIndex: 0,
          label: "Max",
          value: 100,
          length: 50, // Full width in original
          formattedValue: "100",
          barChar: "█",
          useBackticks: false,
          percentage: 100,
        },
      ],
      categories: ["Max"],
      maxLabelWidth: 3,
      maxValueWidth: 3,
      barAreaSize: 50,
      yScale: { min: 0, max: 100, ticks: [0, 100] },
      showValues: false,
      width: 60,
      height: 1,
    };

    const result = renderBarChartInline(layout);
    // Count █ characters - should be scaled to 10
    const barChars = result.match(/█/g);
    expect(barChars).toBeTruthy();
    expect(barChars!.length).toBe(10);
  });
});

describe("renderStackedBarChartInline", () => {
  it("should render stacked bars with segment values", () => {
    const layout: StackedBarChartLayout = {
      type: "bar-stacked",
      stacks: [
        {
          label: "Jan",
          segments: [
            {
              seriesIndex: 0,
              pointIndex: 0,
              label: "Jan",
              value: 10,
              length: 5,
              formattedValue: "10",
              barChar: "█",
              useBackticks: false,
              percentage: 33,
            },
            {
              seriesIndex: 1,
              pointIndex: 0,
              label: "Jan",
              value: 20,
              length: 10,
              formattedValue: "20",
              barChar: "▒",
              useBackticks: true,
              percentage: 66,
            },
          ],
          total: 30,
        },
      ],
      maxLabelWidth: 3,
      maxValueWidth: 2,
      barAreaSize: 15,
      seriesNames: ["A", "B"],
      seriesStyles: [
        { char: "█", useBackticks: false },
        { char: "▒", useBackticks: true },
      ],
      yScale: { min: 0, max: 30, ticks: [0, 30] },
      width: 40,
      height: 1,
    };

    const result = renderStackedBarChartInline(layout);
    expect(result).toContain("Jan:");
    expect(result).toContain("(10+20)");
    expect(result).toContain("█");
    expect(result).toContain("▒");
  });
});

describe("renderChartSummaryInline", () => {
  it("should format chart summary with series and points", () => {
    const result = renderChartSummaryInline("scatter", 50, 3);
    expect(result).toBe("[scatter: 3 series, 50 points]");
  });

  it("should handle single point", () => {
    const result = renderChartSummaryInline("line", 1, 1);
    expect(result).toBe("[line: 1 series, 1 point]");
  });

  it("should replace hyphens with spaces in chart type", () => {
    const result = renderChartSummaryInline("bar-vertical", 10, 2);
    expect(result).toBe("[bar vertical: 2 series, 10 points]");
  });
});
