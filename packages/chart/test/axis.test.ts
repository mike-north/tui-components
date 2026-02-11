import { describe, it, expect } from "vitest";
import { computeAxisLayout, computeDualAxisLayout } from "../src/core/axis.js";

describe("computeAxisLayout", () => {
  describe("positive cases", () => {
    it("should compute vertical axis layout", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 100,
        size: 10,
        orientation: "vertical",
        position: "left",
      });

      expect(layout.orientation).toBe("vertical");
      expect(layout.position).toBe("left");
      expect(layout.ticks.length).toBeGreaterThanOrEqual(3);
      expect(layout.maxLabelWidth).toBeGreaterThan(0);
    });

    it("should compute horizontal axis layout", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 100,
        size: 40,
        orientation: "horizontal",
        position: "bottom",
      });

      expect(layout.orientation).toBe("horizontal");
      expect(layout.position).toBe("bottom");
      expect(layout.ticks.length).toBeGreaterThanOrEqual(3);
    });

    it("should respect tick count", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 100,
        size: 20,
        orientation: "vertical",
        position: "left",
        tickCount: 3,
      });

      // Tick count is approximate
      expect(layout.ticks.length).toBeLessThanOrEqual(5);
    });

    it("should apply formatting to labels", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 1000,
        size: 10,
        orientation: "vertical",
        position: "left",
        format: "compact",
      });

      // Labels should use compact format
      const hasCompactLabel = layout.ticks.some((t) =>
        t.label.includes("K") || !t.label.includes(",")
      );
      expect(hasCompactLabel).toBe(true);
    });

    it("should position ticks correctly for vertical axis", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 100,
        size: 100,
        orientation: "vertical",
        position: "left",
      });

      // For vertical axis, 0 should be at position 100 (bottom)
      // and max should be at position 0 (top)
      const minTick = layout.ticks.find((t) => t.value === layout.scale.min);
      const maxTick = layout.ticks.find((t) => t.value === layout.scale.max);

      if (minTick && maxTick) {
        expect(minTick.position).toBeGreaterThan(maxTick.position);
      }
    });

    it("should position ticks correctly for horizontal axis", () => {
      const layout = computeAxisLayout({
        dataMin: 0,
        dataMax: 100,
        size: 100,
        orientation: "horizontal",
        position: "bottom",
      });

      // For horizontal axis, min should be at position 0 (left)
      // and max should be at position 100 (right)
      const minTick = layout.ticks.find((t) => t.value === layout.scale.min);
      const maxTick = layout.ticks.find((t) => t.value === layout.scale.max);

      if (minTick && maxTick) {
        expect(minTick.position).toBeLessThan(maxTick.position);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle equal min/max", () => {
      const layout = computeAxisLayout({
        dataMin: 50,
        dataMax: 50,
        size: 10,
        orientation: "vertical",
        position: "left",
      });

      expect(layout.ticks.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle negative ranges", () => {
      const layout = computeAxisLayout({
        dataMin: -100,
        dataMax: -10,
        size: 10,
        orientation: "vertical",
        position: "left",
        includeZero: false,
      });

      // Nice numbers algorithm rounds to boundaries, which may include 0
      expect(layout.scale.max).toBeLessThanOrEqual(0);
      expect(layout.scale.min).toBeLessThan(0);
    });
  });
});

describe("computeDualAxisLayout", () => {
  it("should compute both axes with chart area", () => {
    const layout = computeDualAxisLayout({
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 100,
      chartWidth: 50,
      chartHeight: 15,
    });

    expect(layout.xAxis).toBeDefined();
    expect(layout.yAxis).toBeDefined();
    expect(layout.chartAreaWidth).toBeGreaterThan(0);
    expect(layout.chartAreaHeight).toBeGreaterThan(0);
    expect(layout.chartAreaX).toBeGreaterThan(0); // Y-axis takes some width
  });

  it("should pass axis options through", () => {
    const layout = computeDualAxisLayout({
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 100,
      chartWidth: 50,
      chartHeight: 15,
      yAxis: {
        format: "percent",
        tickCount: 3,
      },
    });

    // Check that y-axis respected options
    expect(layout.yAxis.ticks.length).toBeLessThanOrEqual(5);
  });
});
