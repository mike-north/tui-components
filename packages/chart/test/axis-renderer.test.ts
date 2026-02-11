import { describe, it, expect } from "vitest";
import {
  computeYAxisRow,
  renderXAxis,
  buildChartRow,
  type YAxisConfig,
  type XAxisConfig,
} from "../src/core/axis-renderer.js";
import { AXIS_CHARS } from "../src/core/chars.js";

describe("axis-renderer", () => {
  describe("computeYAxisRow", () => {
    const defaultConfig: YAxisConfig = {
      scale: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] },
      chartHeight: 10,
      labelWidth: 5,
    };

    it("should return tick mark (┤) for rows with tick labels", () => {
      // Row 9 (top) should have tick at 100
      const result = computeYAxisRow(9, defaultConfig);
      expect(result.hasTick).toBe(true);
      expect(result.axisChar).toBe(AXIS_CHARS.yTickLeft);
      expect(result.label.trim()).toBe("100");
    });

    it("should return vertical bar (│) for rows without tick labels", () => {
      // Row 8 has no tick (between 90% and 100%)
      const result = computeYAxisRow(8, defaultConfig);
      expect(result.hasTick).toBe(false);
      expect(result.axisChar).toBe(AXIS_CHARS.vertical);
      expect(result.label.trim()).toBe("");
    });

    it("should skip zero tick (reserved for x-axis)", () => {
      // Row 0 is at 0-10% range, but zero tick should be skipped
      const result = computeYAxisRow(0, defaultConfig);
      expect(result.hasTick).toBe(false);
      expect(result.label.trim()).toBe("");
    });

    it("should format tick values according to format option", () => {
      const percentConfig: YAxisConfig = {
        ...defaultConfig,
        format: "percent",
      };
      const result = computeYAxisRow(9, percentConfig);
      expect(result.label).toContain("%");
    });

    it("should respect decimal places", () => {
      const decimalConfig: YAxisConfig = {
        scale: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] },
        chartHeight: 10,
        labelWidth: 6,
        decimals: 2,
      };
      const result = computeYAxisRow(9, decimalConfig);
      expect(result.label.trim()).toBe("1.00");
    });

    it("should handle negative scales", () => {
      const negativeConfig: YAxisConfig = {
        scale: { min: -100, max: 0, ticks: [-100, -75, -50, -25, 0] },
        chartHeight: 10,
        labelWidth: 6,
      };
      // For negative scale: -100 is at tickNorm=0 (skipped), 0 is at tickNorm=1.0 (top)
      // Row 9 (top) should show "0"
      const topResult = computeYAxisRow(9, negativeConfig);
      expect(topResult.label.trim()).toBe("0");
      expect(topResult.hasTick).toBe(true);

      // Row 0 (bottom) has tickNorm=0 which is skipped
      const bottomResult = computeYAxisRow(0, negativeConfig);
      expect(bottomResult.hasTick).toBe(false);

      // Row 2 should show -75 (tickNorm=0.25, falls in 20-30% range)
      const midResult = computeYAxisRow(2, negativeConfig);
      expect(midResult.label.trim()).toBe("-75");
      expect(midResult.hasTick).toBe(true);
    });
  });

  describe("renderXAxis", () => {
    const defaultConfig: XAxisConfig = {
      categories: ["Q1", "Q2", "Q3"],
      barWidth: 10,
      yAxisWidth: 5,
      chartWidth: 40,
      minValue: 0,
    };

    it("should include origin character (└)", () => {
      const result = renderXAxis(defaultConfig);
      expect(result.axisLine).toContain(AXIS_CHARS.origin);
    });

    it("should include tick marks (┬) for each category", () => {
      const result = renderXAxis(defaultConfig);
      const tickCount = (result.axisLine.match(/┬/g) || []).length;
      expect(tickCount).toBe(3);
    });

    it("should include zero label at origin", () => {
      const result = renderXAxis(defaultConfig);
      expect(result.axisLine).toMatch(/0\s*└/);
    });

    it("should center labels under tick marks", () => {
      const result = renderXAxis(defaultConfig);
      // Labels should have leading spaces (centered)
      expect(result.labelLine).toContain("Q1");
      expect(result.labelLine).toContain("Q2");
      expect(result.labelLine).toContain("Q3");
      // Should have indentation for y-axis width
      expect(result.labelLine.startsWith(" ".repeat(defaultConfig.yAxisWidth))).toBe(true);
    });

    it("should handle single category", () => {
      const singleConfig: XAxisConfig = {
        ...defaultConfig,
        categories: ["Only"],
      };
      const result = renderXAxis(singleConfig);
      const tickCount = (result.axisLine.match(/┬/g) || []).length;
      expect(tickCount).toBe(1);
      expect(result.labelLine).toContain("Only");
    });

    it("should handle long category labels", () => {
      const longConfig: XAxisConfig = {
        ...defaultConfig,
        categories: ["January", "February"],
        barWidth: 15,
      };
      const result = renderXAxis(longConfig);
      expect(result.labelLine).toContain("January");
      expect(result.labelLine).toContain("February");
    });

    it("should format zero label according to format option", () => {
      const percentConfig: XAxisConfig = {
        ...defaultConfig,
        format: "percent",
      };
      const result = renderXAxis(percentConfig);
      expect(result.axisLine).toContain("%");
    });
  });

  describe("buildChartRow", () => {
    const config: YAxisConfig = {
      scale: { min: 0, max: 100, ticks: [0, 50, 100] },
      chartHeight: 5,
      labelWidth: 5,
    };

    it("should combine y-axis label with content", () => {
      const row = buildChartRow(4, "████████", config);
      expect(row).toContain("100");
      expect(row).toContain("████████");
      expect(row).toContain(AXIS_CHARS.yTickLeft);
    });

    it("should use vertical bar for rows without ticks", () => {
      const row = buildChartRow(3, "████", config);
      expect(row).toContain(AXIS_CHARS.vertical);
      expect(row).not.toContain(AXIS_CHARS.yTickLeft);
    });
  });
});
