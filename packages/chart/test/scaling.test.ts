import { describe, it, expect } from "vitest";
import {
  computeNiceTicks,
  formatTickValue,
  scaleValue,
  unscaleValue,
} from "../src/core/scaling.js";

describe("computeNiceTicks", () => {
  describe("positive cases", () => {
    it("should compute nice ticks for typical data range", () => {
      const result = computeNiceTicks({
        dataMin: 3,
        dataMax: 97,
      });

      expect(result.min).toBeLessThanOrEqual(0);
      expect(result.max).toBeGreaterThanOrEqual(97);
      expect(result.ticks.length).toBeGreaterThanOrEqual(3);
      expect(result.ticks[0]).toBe(result.min);
      expect(result.ticks[result.ticks.length - 1]).toBe(result.max);
    });

    it("should include zero when data is positive", () => {
      const result = computeNiceTicks({
        dataMin: 50,
        dataMax: 100,
        includeZero: true,
      });

      expect(result.min).toBe(0);
    });

    it("should respect forced min/max", () => {
      const result = computeNiceTicks({
        dataMin: 10,
        dataMax: 90,
        forceMin: 0,
        forceMax: 100,
      });

      expect(result.min).toBe(0);
      expect(result.max).toBe(100);
    });

    it("should use specified tick count", () => {
      const result = computeNiceTicks({
        dataMin: 0,
        dataMax: 100,
        tickCount: 6,
      });

      // Tick count is approximate due to nice number rounding
      expect(result.ticks.length).toBeGreaterThanOrEqual(5);
      expect(result.ticks.length).toBeLessThanOrEqual(8);
    });

    it("should handle small decimal ranges", () => {
      const result = computeNiceTicks({
        dataMin: 0.003,
        dataMax: 0.097,
        tickCount: 4,
      });

      expect(result.min).toBeLessThanOrEqual(0.003);
      expect(result.max).toBeGreaterThanOrEqual(0.097);
      expect(result.step).toBeLessThan(1);
    });

    it("should handle large ranges with nice intervals", () => {
      const result = computeNiceTicks({
        dataMin: 0,
        dataMax: 1_000_000,
        tickCount: 5,
      });

      // Should use nice round numbers like 0, 250K, 500K, 750K, 1M
      expect(result.step).toBeGreaterThanOrEqual(100_000);
    });

    it("should handle negative ranges", () => {
      const result = computeNiceTicks({
        dataMin: -50,
        dataMax: 50,
      });

      expect(result.min).toBeLessThanOrEqual(-50);
      expect(result.max).toBeGreaterThanOrEqual(50);
      expect(result.ticks).toContain(0);
    });
  });

  describe("edge cases", () => {
    it("should handle single value (equal min/max)", () => {
      const result = computeNiceTicks({
        dataMin: 50,
        dataMax: 50,
      });

      expect(result.ticks.length).toBeGreaterThanOrEqual(2);
      expect(result.min).toBeLessThan(50);
      expect(result.max).toBeGreaterThan(50);
    });

    it("should handle zero range at zero", () => {
      const result = computeNiceTicks({
        dataMin: 0,
        dataMax: 0,
      });

      expect(result.ticks.length).toBeGreaterThanOrEqual(2);
    });

    it("should not include zero when explicitly disabled", () => {
      const result = computeNiceTicks({
        dataMin: 50,
        dataMax: 100,
        includeZero: false,
      });

      expect(result.min).toBeGreaterThan(0);
    });
  });
});

describe("formatTickValue", () => {
  describe("number format", () => {
    it("should format integers without decimals", () => {
      expect(formatTickValue(1000, "number")).toBe("1,000");
    });

    it("should format decimals appropriately", () => {
      expect(formatTickValue(1000.5, "number")).toBe("1,000.5");
    });

    it("should respect explicit decimal places", () => {
      expect(formatTickValue(1000, "number", 2)).toBe("1000.00");
    });
  });

  describe("percent format", () => {
    it("should format as percentage", () => {
      expect(formatTickValue(0.5, "percent")).toBe("50%");
    });

    it("should respect decimal places", () => {
      expect(formatTickValue(0.333, "percent", 1)).toBe("33.3%");
    });
  });

  describe("compact format", () => {
    it("should format thousands as K", () => {
      expect(formatTickValue(1500, "compact")).toBe("1.5K");
    });

    it("should format millions as M", () => {
      expect(formatTickValue(2_500_000, "compact")).toBe("2.5M");
    });

    it("should format billions as B", () => {
      expect(formatTickValue(3_000_000_000, "compact")).toBe("3.0B");
    });

    it("should format small numbers without suffix", () => {
      expect(formatTickValue(500, "compact")).toBe("500");
    });
  });

  describe("currency format", () => {
    it("should format with dollar sign", () => {
      expect(formatTickValue(1000, "currency")).toBe("$1,000");
    });

    it("should respect decimal places", () => {
      expect(formatTickValue(1000, "currency", 2)).toBe("$1,000.00");
    });
  });
});

describe("scaleValue", () => {
  it("should scale value to position correctly", () => {
    expect(scaleValue(50, 0, 100, 200)).toBe(100);
    expect(scaleValue(0, 0, 100, 200)).toBe(0);
    expect(scaleValue(100, 0, 100, 200)).toBe(200);
  });

  it("should handle non-zero min", () => {
    expect(scaleValue(75, 50, 100, 100)).toBe(50);
  });

  it("should handle equal min/max", () => {
    const result = scaleValue(50, 50, 50, 100);
    expect(result).toBe(50); // Center of range
  });
});

describe("unscaleValue", () => {
  it("should inverse scale correctly", () => {
    expect(unscaleValue(100, 0, 100, 200)).toBe(50);
    expect(unscaleValue(0, 0, 100, 200)).toBe(0);
    expect(unscaleValue(200, 0, 100, 200)).toBe(100);
  });

  it("should be inverse of scaleValue", () => {
    const value = 75;
    const scaled = scaleValue(value, 0, 100, 200);
    const unscaled = unscaleValue(scaled, 0, 100, 200);
    expect(unscaled).toBe(value);
  });

  it("should handle zero size", () => {
    expect(unscaleValue(50, 0, 100, 0)).toBe(0);
  });
});
