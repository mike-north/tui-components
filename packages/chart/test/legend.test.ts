import { describe, it, expect } from "vitest";
import {
  computeLegendLayout,
  formatLegendItem,
  getLegendItemWidth,
  renderLegendRow,
} from "../src/core/legend.js";

describe("legend", () => {
  describe("getLegendItemWidth", () => {
    it("should calculate width without backticks", () => {
      const item = { name: "Test", symbol: "█", useBackticks: false };
      const width = getLegendItemWidth(item);
      // "█ Test" = 1 + 1 + 4 = 6
      expect(width).toBe(6);
    });

    it("should add extra width for backticks", () => {
      const item = { name: "Test", symbol: "█", useBackticks: true };
      const width = getLegendItemWidth(item);
      // With backticks: base + 1 = 7
      expect(width).toBe(7);
    });
  });

  describe("formatLegendItem", () => {
    it("should format item without backticks", () => {
      const item = { name: "Sales", symbol: "█", useBackticks: false };
      expect(formatLegendItem(item, false)).toBe("█ Sales");
    });

    it("should format item with backticks for markdown", () => {
      const item = { name: "Sales", symbol: "█", useBackticks: true };
      expect(formatLegendItem(item, true)).toBe(" `█` Sales");
    });

    it("should not add backticks if not needed", () => {
      const item = { name: "Sales", symbol: "█", useBackticks: false };
      expect(formatLegendItem(item, true)).toBe("█ Sales");
    });
  });

  describe("computeLegendLayout", () => {
    it("should return empty layout for none position", () => {
      const layout = computeLegendLayout({
        items: [{ name: "Test", symbol: "█", useBackticks: false }],
        position: "none",
      });

      expect(layout.rows).toHaveLength(0);
      expect(layout.totalWidth).toBe(0);
    });

    it("should return empty layout for empty items", () => {
      const layout = computeLegendLayout({
        items: [],
        position: "bottom",
      });

      expect(layout.rows).toHaveLength(0);
    });

    it("should fit items on one row if possible", () => {
      const layout = computeLegendLayout({
        items: [
          { name: "A", symbol: "█", useBackticks: false },
          { name: "B", symbol: "▓", useBackticks: false },
        ],
        position: "bottom",
        maxWidth: 80,
      });

      expect(layout.rows).toHaveLength(1);
      expect(layout.rows[0]?.items).toHaveLength(2);
    });

    it("should wrap to multiple rows when needed", () => {
      const layout = computeLegendLayout({
        items: [
          { name: "Very Long Name A", symbol: "█", useBackticks: false },
          { name: "Very Long Name B", symbol: "▓", useBackticks: false },
          { name: "Very Long Name C", symbol: "░", useBackticks: false },
        ],
        position: "bottom",
        maxWidth: 30,
      });

      expect(layout.rows.length).toBeGreaterThan(1);
    });

    it("should set boxed flag", () => {
      const layout = computeLegendLayout({
        items: [{ name: "Test", symbol: "█", useBackticks: false }],
        position: "bottom",
        boxed: true,
      });

      expect(layout.boxed).toBe(true);
    });
  });

  describe("renderLegendRow", () => {
    it("should render row without markdown", () => {
      const row = {
        items: [
          { name: "A", symbol: "█", useBackticks: false },
          { name: "B", symbol: "▓", useBackticks: false },
        ],
        width: 12,
      };

      const result = renderLegendRow(row, false);
      expect(result).toBe("█ A  ▓ B");
    });

    it("should render row with markdown", () => {
      const row = {
        items: [
          { name: "A", symbol: "█", useBackticks: false },
          { name: "B", symbol: "▓", useBackticks: true },
        ],
        width: 15,
      };

      const result = renderLegendRow(row, true);
      expect(result).toContain("█ A");
      expect(result).toContain("`▓`");
    });
  });
});
